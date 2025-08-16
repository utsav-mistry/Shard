import { exec } from 'child_process';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fixed port allocation
const PORT_CONFIG = {
    mern: { backend: 12000, frontend: 12001 },
    django: { backend: 13000 },
    flask: { backend: 14000 },
};

const usedContainers = new Set();

const deployContainer = async (localPath, stack, subdomain, projectId, deploymentId) => {
    const imageName = `shard-${subdomain}`;
    const dockerfilePath = path.join(__dirname, "..", "dockerfiles", `Dockerfile.${stack}`);
    const envFilePath = path.join(localPath, ".env");

    logger.info(`[Project ${projectId}] Building Docker image: ${imageName}`);
    await execPromise(`docker build -f ${dockerfilePath} -t ${imageName} ${localPath}`);
    logger.info(`[Project ${projectId}] Image built: ${imageName}`);

    // Cleanup existing container
    await execPromise(`docker rm -f ${subdomain}`).catch(() =>
        logger.info(`[Project ${projectId}] No existing container to remove for ${subdomain}`)
    );

    // Determine port mapping
    const ports = getPortMapping(stack, subdomain);
    const portArgs = ports.map(({ container, host }) => `-p ${host}:${container}`).join(" ");

    // Check if .env file exists and include it in Docker run command
    const envFileArg = fs.existsSync(envFilePath) ? `--env-file ${envFilePath}` : "";

    if (fs.existsSync(envFilePath)) {
        logger.info(`[Project ${projectId}] Loading project-specific environment variables from: ${envFilePath}`);
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        const envVarCount = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;
        logger.info(`[Project ${projectId}] Found ${envVarCount} environment variables for project ${projectId}`);
    } else {
        logger.info(`[Project ${projectId}] No environment variables found - proceeding without .env file`);
    }

    // Run container with or without environment variables
    const dockerCmd = `docker run -d --memory=512m --name ${subdomain} ${portArgs} ${envFileArg} ${imageName}`.trim();
    const result = await execPromise(dockerCmd);

    logger.info(`[Project ${projectId}] Container running for ${subdomain} at:`);
    ports.forEach(p => logger.info(`[Project ${projectId}] → http://localhost:${p.host}`));

    captureRuntimeLogs(subdomain, projectId, deploymentId);
    
    return result;
};

const getPortMapping = (stack, subdomain) => {
    if (stack === "mern") {
        return [
            { container: 12000, host: PORT_CONFIG.mern.backend }
        ];
    }
    if (stack === "django") {
        return [{ container: 8000, host: PORT_CONFIG.django.backend }];
    }
    if (stack === "flask") {
        return [{ container: 5000, host: PORT_CONFIG.flask.backend }];
    }
    throw new Error(`Unsupported stack: ${stack}`);
};

const captureRuntimeLogs = (containerName, projectId, deploymentId) => {
    const process = exec(`docker logs -f ${containerName}`);

    process.stdout.on("data", async (data) => {
        await sendLog(projectId, deploymentId, "runtime", data);
    });

    process.stderr.on("data", async (data) => {
        await sendLog(projectId, deploymentId, "runtime", data);
    });
};

const sendLog = async (projectId, deploymentId, type, content) => {
    try {
        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/logs`, {
            projectId,
            deploymentId,
            type,
            content: content.toString()
        });
    } catch (err) {
        logger.error("Failed to push runtime logs:", err.message);
    }
};

const execPromise = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                logger.error("Docker Error:", stderr);
                return reject(err);
            }
            resolve(stdout);
        });
    });
};

const cleanupExistingContainer = async (containerName) => {
    try {
        await execPromise(`docker rm -f ${containerName}`);
    } catch (err) {
        if (!err.message.includes("No such container")) {
            throw err;
        }
    }
};

export { deployContainer, cleanupExistingContainer };

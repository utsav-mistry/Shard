import { exec } from 'child_process';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fixed port allocation
const PORT_CONFIG = {
    mern: { backend: 12000, frontend: 12001 },
    django: { backend: 13000 },
    flask: { backend: 14000 },
};

const usedContainers = new Set();

const buildAndRunContainer = async ({ localPath, stack, subdomain, projectId, deploymentId }) => {
    const imageName = `shard-${subdomain}`;
    const dockerfilePath = path.join(__dirname, "..", "dockerfiles", `Dockerfile.${stack}`);
    const envFilePath = path.join(localPath, ".env");

    console.log(`[Project ${projectId}] Building Docker image: ${imageName}`);
    await execPromise(`docker build -f ${dockerfilePath} -t ${imageName} ${localPath}`);
    console.log(`[Project ${projectId}] Image built: ${imageName}`);

    // Cleanup existing container
    await execPromise(`docker rm -f ${subdomain}`).catch(() =>
        console.log(`[Project ${projectId}] No existing container to remove for ${subdomain}`)
    );

    // Determine port mapping
    const ports = getPortMapping(stack, subdomain);
    const portArgs = ports.map(({ container, host }) => `-p ${host}:${container}`).join(" ");

    // Check if .env file exists and include it in Docker run command
    const envFileArg = fs.existsSync(envFilePath) ? `--env-file ${envFilePath}` : "";

    if (fs.existsSync(envFilePath)) {
        console.log(`[Project ${projectId}] Loading project-specific environment variables from: ${envFilePath}`);
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        const envVarCount = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;
        console.log(`[Project ${projectId}] Found ${envVarCount} environment variables for project ${projectId}`);
    } else {
        console.log(`[Project ${projectId}] No environment variables found for project ${projectId}`);
    }

    // Run container with project-specific environment variables
    await execPromise(
        `docker run -d --memory=512m --name ${subdomain} ${portArgs} ${envFileArg} ${imageName}`
    );

    console.log(`[Project ${projectId}] Container running for ${subdomain} at:`);
    ports.forEach(p => console.log(`[Project ${projectId}] → http://${subdomain}.localhost:${p.host}`));

    captureRuntimeLogs(subdomain, projectId, deploymentId);
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
        await axios.post("http://localhost:5000/logs", {
            projectId,
            deploymentId,
            type,
            content: content.toString()
        });
    } catch (err) {
        console.error("Failed to push runtime logs:", err.message);
    }
};

const execPromise = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error("Docker Error:", stderr);
                return reject(err);
            }
            resolve(stdout);
        });
    });
};

export { buildAndRunContainer };

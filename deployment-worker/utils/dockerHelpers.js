const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const logger = require('./logger');
const StreamingLogger = require('./streamingLogger.js');

// Fixed port allocation
const PORT_CONFIG = {
    mern: { backend: 12000, frontend: 12001 },
    django: { backend: 13000 },
    flask: { backend: 14000 },
};

const usedContainers = new Set();

const deployContainer = async (localPath, stack, subdomain, projectId, deploymentId, socket = null) => {
    const imageName = `shard-project-${projectId}`;
    const dockerfilePath = path.join(__dirname, "..", "dockerfiles", `Dockerfile.${stack}`);
    const envFilePath = path.join(localPath, ".env");

    // Use streaming logger if socket is provided
    if (socket) {
        const streamLogger = new StreamingLogger(socket, projectId, deploymentId);

        try {
            // Cleanup existing container first
            await streamLogger.cleanupContainer(subdomain);

            // Build Docker image with streaming
            await streamLogger.buildDockerImage(localPath, dockerfilePath, imageName);

            // Determine port mapping
            const ports = getPortMapping(stack, subdomain);

            // Check environment file
            const envFileExists = fs.existsSync(envFilePath);
            if (envFileExists) {
                const envContent = fs.readFileSync(envFilePath, 'utf8');
                const envVarCount = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;
                streamLogger.emitLog(`Loading ${envVarCount} environment variables from .env file`, 'info', 'deploy');
            } else {
                streamLogger.emitLog('No environment variables found - proceeding without .env file', 'info', 'deploy');
            }

            // Run container with streaming
            const containerOptions = {
                ports: ports,
                envFile: envFileExists ? envFilePath : null,
                memory: '512m'
            };

            await streamLogger.runDockerContainer(imageName, subdomain, containerOptions);

            // Log success information
            streamLogger.emitLog(`Container running for ${subdomain} at:`, 'success', 'deploy');
            ports.forEach(p => {
                streamLogger.emitLog(`→ http://${subdomain}.localhost:${p.host}`, 'success', 'deploy');
            });

            return { success: true, ports };

        } catch (error) {
            throw new Error(`Docker deployment failed: ${error.message}`);
        }
    } else {
        // Fallback to original method for backward compatibility
        logger.info(`[Project ${projectId}] Building Docker image: ${imageName}`);

        // Skip cleanup for project-based images to enable reuse
        if (!imageName.includes('shard-project-')) {
            await execPromise(`docker rmi ${imageName}`).catch(() =>
                logger.info(`[Project ${projectId}] No existing image to remove for ${imageName}`)
            );
        } else {
            logger.info(`[Project ${projectId}] Reusing existing project image: ${imageName}`);
        }

        await execPromise(`docker build -f ${dockerfilePath} -t ${imageName} ${localPath}`);
        logger.info(`[Project ${projectId}] Image built: ${imageName}`);

        // Clean up dangling images
        await execPromise(`docker image prune -f`).catch(() =>
            logger.info(`[Project ${projectId}] Failed to clean dangling images`)
        );

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

        // Run container with restart policy and environment variables
        const dockerCmd = `docker run -d --memory=512m --restart=unless-stopped --name ${subdomain} ${portArgs} ${envFileArg} ${imageName}`.trim();
        const result = await execPromise(dockerCmd);

        logger.info(`[Project ${projectId}] Container running for ${subdomain} at:`);
        ports.forEach(p => logger.info(`[Project ${projectId}] → http://${subdomain}.localhost:${p.host}`));

        captureRuntimeLogs(subdomain, projectId, deploymentId);

        return result;
    }
};

const getPortMapping = (stack, subdomain) => {
    if (stack === "mern") {
        return [
            { container: 12000, host: PORT_CONFIG.mern.backend },
            { container: 12001, host: PORT_CONFIG.mern.frontend }
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

const getCustomDomainUrl = (stack, subdomain) => {
    const ports = getPortMapping(stack, subdomain);

    if (stack === "mern" && ports.length > 1) {
        // For MERN, return frontend URL with subdomain
        const frontendPort = ports.find(p => p.host === PORT_CONFIG.mern.frontend);
        return `http://${subdomain}.localhost:${frontendPort.host}`;
    }

    // For other stacks, return backend URL with subdomain
    return `http://${subdomain}.localhost:${ports[0].host}`;
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

module.exports = { deployContainer, cleanupExistingContainer, getCustomDomainUrl };

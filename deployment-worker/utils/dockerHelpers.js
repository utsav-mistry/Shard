/**
 * @fileoverview Docker Container Management Utilities
 * @description Comprehensive Docker operations for deployment containerization and cleanup
 * @author Utsav Mistry
 * @version 0.2.3
 */

const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const logger = require('./logger');
const StreamingLogger = require('./streamingLogger.js');
const { validateDockerEnvironment } = require('./dockerChecker');
const reverseProxyManager = require('../services/reverseProxyManager');

/**
 * Public port allocation configuration for reverse proxy
 * @type {Object}
 * @property {Object} mern - MERN stack port configuration
 * @property {Object} django - Django stack port configuration
 * @property {Object} flask - Flask stack port configuration
 * @description Static port mappings for different technology stacks
 */
const PORT_CONFIG = {
    mern: { backend: 12000 },
    django: { backend: 13000 },
    flask: { backend: 14000 },
};

/**
 * Set of currently used container names
 * @type {Set<string>}
 * @description Tracks active containers to prevent naming conflicts
 */
const usedContainers = new Set();

/**
 * Deploy application container with Docker
 * @async
 * @function deployContainer
 * @param {string} localPath - Absolute path to project source code
 * @param {string} stack - Technology stack ('mern', 'django', 'flask')
 * @param {string} subdomain - Project subdomain for container naming
 * @param {string} projectId - Unique project identifier
 * @param {string} deploymentId - Unique deployment identifier
 * @param {Object} [socket=null] - Socket.io connection for streaming logs
 * @returns {Promise<Object>} Deployment result with success status and port information
 * @throws {Error} Docker validation, build, or runtime errors
 * @description Complete Docker deployment pipeline: validation → cleanup → build → run → proxy setup.
 * Supports both streaming (with socket) and standard deployment modes.
 * @example
 * const result = await deployContainer(
 *   '/path/to/project',
 *   'mern',
 *   'myapp',
 *   'proj123',
 *   'deploy456',
 *   socketConnection
 * );
 */
const deployContainer = async (localPath, stack, subdomain, projectId, deploymentId, socket = null) => {
    // Validate Docker environment before starting deployment
    try {
        await validateDockerEnvironment();
    } catch (error) {
        logger.error(`Docker validation failed for project ${projectId}: ${error.message}`);
        throw error;
    }

    // Initialize reverse proxy if not running
    await reverseProxyManager.initialize();

    const imageName = `shard-project-${projectId}`;
    const dockerfilePath = path.join(__dirname, "..", "dockerfiles", `Dockerfile.${stack}`);
    const envFilePath = path.join(localPath, ".env");

    // Generate unique container name using subdomain to avoid conflicts
    const containerName = `shard-${subdomain}`;

    // Extract current repo folder name from localPath to preserve it during cleanup
    const currentRepoFolder = path.basename(localPath);

    // Pre-deployment cleanup to prevent conflicts (but preserve current repo)
    logger.info(`[Project ${projectId}] Running pre-deployment cleanup`);
    try {
        await cleanupProjectContainers(projectId, subdomain, currentRepoFolder);
        logger.info(`[Project ${projectId}] Pre-deployment cleanup completed`);
    } catch (cleanupError) {
        logger.warn(`[Project ${projectId}] Pre-deployment cleanup failed: ${cleanupError.message}`);
        // Continue with deployment even if cleanup fails
    }

    // Use streaming logger if socket is provided
    if (socket) {
        const streamLogger = new StreamingLogger(socket, projectId, deploymentId);

        try {
            // Cleanup existing container first
            await streamLogger.cleanupContainer(containerName);

            // Build Docker image with streaming
            await streamLogger.buildDockerImage(localPath, dockerfilePath, imageName);

            // Allocate internal ports through reverse proxy manager
            const ports = await getPortMappingWithProxy(stack, subdomain);

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

            await streamLogger.runDockerContainer(imageName, containerName, containerOptions);

            // Log success information with public URL
            const publicUrl = reverseProxyManager.getPublicUrl(subdomain, stack);
            streamLogger.emitLog(`Container running for ${subdomain} at:`, 'success', 'deploy');
            streamLogger.emitLog(`→ ${publicUrl}`, 'success', 'deploy');
            streamLogger.emitLog(`→ Internal ports: ${ports.map(p => p.host).join(', ')}`, 'info', 'deploy');

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
        const containerName = `shard-${subdomain}`;
        await execPromise(`docker rm -f ${containerName}`).catch(() =>
            logger.info(`[Project ${projectId}] No existing container to remove for ${containerName}`)
        );

        // Allocate internal ports through reverse proxy manager
        const ports = await getPortMappingWithProxy(stack, subdomain);
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
        const dockerCmd = `docker run -d --memory=512m --restart=unless-stopped --name ${containerName} ${portArgs} ${envFileArg} ${imageName}`.trim();
        const result = await execPromise(dockerCmd);

        // Log success information with public URL
        const publicUrl = reverseProxyManager.getPublicUrl(subdomain, stack);
        logger.info(`[Project ${projectId}] Container running for ${subdomain} at:`);
        logger.info(`[Project ${projectId}] → ${publicUrl}`);
        logger.info(`[Project ${projectId}] → Internal ports: ${ports.map(p => p.host).join(', ')}`);

        captureRuntimeLogs(containerName, projectId, deploymentId);

        return result;
    }
};

/**
 * Get port mapping with reverse proxy integration
 * @async
 * @function getPortMappingWithProxy
 * @param {string} stack - Technology stack ('mern', 'django', 'flask')
 * @param {string} subdomain - Project subdomain
 * @returns {Promise<Array<Object>>} Port mapping configuration
 * @returns {number} returns[].container - Container internal port
 * @returns {number} returns[].host - Host port allocated by proxy manager
 * @throws {Error} Unsupported stack or port allocation errors
 * @description Allocates dynamic ports through reverse proxy manager and configures Nginx routing.
 */
const getPortMappingWithProxy = async (stack, subdomain) => {
    // Use reverseProxyManager for dynamic port allocation
    const port = await reverseProxyManager.allocatePort(subdomain, stack);

    // Register with reverse proxy using allocated internal port
    await reverseProxyManager.updateNginxConfig(subdomain, stack, port);

    // Return container port mapping based on stack
    const containerPorts = {
        mern: 5000,    // Express backend serves everything
        django: 8000,  // Django backend
        flask: 5000    // Flask backend
    };

    const containerPort = containerPorts[stack];
    if (!containerPort) {
        throw new Error(`Unsupported stack: ${stack}`);
    }

    return [{ container: containerPort, host: port }];
};

/**
 * Legacy port mapping function for backward compatibility
 * @function getPortMapping
 * @param {string} stack - Technology stack
 * @param {string} subdomain - Project subdomain (unused in legacy mode)
 * @returns {Array<Object>} Static port mapping configuration
 * @deprecated Use getPortMappingWithProxy for dynamic port allocation
 * @description Provides static port mappings without reverse proxy integration.
 */
const getPortMapping = (stack, subdomain) => {
    if (stack === "mern") {
        return [
            { container: 5000, host: PORT_CONFIG.mern.backend }
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

/**
 * Get custom domain URL for deployed application
 * @function getCustomDomainUrl
 * @param {string} stack - Technology stack
 * @param {string} subdomain - Project subdomain
 * @returns {string} Public URL for accessing the deployed application
 * @description Generates public URL using reverse proxy manager for consistent routing.
 */
const getCustomDomainUrl = (stack, subdomain) => {
    // Use reverse proxy manager for consistent URL generation
    return reverseProxyManager.getPublicUrl(subdomain, stack);
};

/**
 * Capture and stream runtime logs from Docker container
 * @function captureRuntimeLogs
 * @param {string} containerName - Docker container name
 * @param {string} projectId - Project identifier
 * @param {string} deploymentId - Deployment identifier
 * @description Streams container logs to backend API for real-time monitoring.
 */
const captureRuntimeLogs = (containerName, projectId, deploymentId) => {
    const process = exec(`docker logs -f ${containerName}`);

    process.stdout.on("data", async (data) => {
        await sendLog(projectId, deploymentId, "runtime", data);
    });

    process.stderr.on("data", async (data) => {
        await sendLog(projectId, deploymentId, "runtime", data);
    });
};

/**
 * Send log entry to backend API
 * @async
 * @function sendLog
 * @param {string} projectId - Project identifier
 * @param {string} deploymentId - Deployment identifier
 * @param {string} type - Log type ('runtime', 'build', 'error')
 * @param {string} content - Log content
 * @description Sends log entries to backend for storage and frontend display.
 */
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

/**
 * Execute shell command as Promise
 * @function execPromise
 * @param {string} cmd - Shell command to execute
 * @returns {Promise<string>} Command stdout
 * @throws {Error} Command execution errors with stderr details
 * @description Promisified wrapper for child_process.exec with error logging.
 */
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

/**
 * Cleanup existing Docker container by name
 * @async
 * @function cleanupExistingContainer
 * @param {string} containerName - Container name to remove
 * @throws {Error} Container removal errors (except 'No such container')
 * @description Forcefully removes existing container, ignoring 'not found' errors.
 */
const cleanupExistingContainer = async (containerName) => {
    try {
        await execPromise(`docker rm -f ${containerName}`);
    } catch (err) {
        if (!err.message.includes("No such container")) {
            throw err;
        }
    }
};

/**
 * Comprehensive cleanup of all project resources
 * @async
 * @function cleanupProjectContainers
 * @param {string} projectId - Project identifier
 * @param {string} subdomain - Project subdomain
 * @param {string} [currentRepoFolder=null] - Current repo folder to preserve during cleanup
 * @returns {Promise<Object>} Cleanup result summary
 * @throws {Error} Critical cleanup failures
 * @description Removes containers, images, proxy mappings, repo folders, and dangling resources.
 * Preserves current deployment's repository folder to avoid interrupting active deployments.
 * @example
 * const result = await cleanupProjectContainers('proj123', 'myapp', 'proj123-1234567890');
 * console.log('Cleanup completed:', result.cleaned);
 */
const cleanupProjectContainers = async (projectId, subdomain, currentRepoFolder = null) => {
    try {
        logger.info(`[Project ${projectId}] Starting comprehensive cleanup of all project resources`);

        // Remove from proxy configuration
        try {
            const proxyConfig = require('../services/proxyConfig');
            proxyConfig.removeMapping(subdomain);

            logger.info(`[Cleanup] Removed reverse proxy mapping for ${subdomain}`);
        } catch (proxyError) {
            logger.warn(`[Cleanup] Failed to remove proxy mapping: ${proxyError.message}`);
        }

        // 1. Stop and remove container by subdomain (with shard- prefix)
        const containerName = `shard-${subdomain}`;
        try {
            await execPromise(`docker rm -f ${containerName}`);
            logger.info(`[Project ${projectId}] Removed container: ${containerName}`);
        } catch (err) {
            if (!err.message.includes("No such container")) {
                logger.warn(`[Project ${projectId}] Failed to remove container ${containerName}: ${err.message}`);
            }
        }

        // 2. Remove project-specific Docker image (force remove)
        const imageName = `shard-project-${projectId}`;
        try {
            await execPromise(`docker rmi -f ${imageName}`);
            logger.info(`[Project ${projectId}] Force removed image: ${imageName}`);
        } catch (err) {
            if (!err.message.includes("No such image")) {
                logger.warn(`[Project ${projectId}] Failed to remove image ${imageName}: ${err.message}`);
            }
        }

        // 3. Clean up repos/ folder for this project (but preserve current deployment's repo)
        const fs = require('fs-extra');
        const reposPath = path.join(__dirname, '..', 'repos');
        try {
            const repoFolders = await fs.readdir(reposPath);
            const projectRepoFolders = repoFolders.filter(folder => folder.startsWith(projectId));

            for (const folder of projectRepoFolders) {
                // Skip the current deployment's repo folder
                if (currentRepoFolder && folder === currentRepoFolder) {
                    logger.info(`[Project ${projectId}] Preserving current repo folder: ${folder}`);
                    continue;
                }

                const folderPath = path.join(reposPath, folder);
                await fs.remove(folderPath);
                logger.info(`[Project ${projectId}] Removed repo folder: ${folder}`);
            }
        } catch (err) {
            logger.warn(`[Project ${projectId}] Failed to cleanup repos folder: ${err.message}`);
        }

        // 4. Clean up builds/ folder for this project
        const buildsPath = path.join(__dirname, '..', 'builds');
        try {
            if (await fs.pathExists(buildsPath)) {
                const buildFolders = await fs.readdir(buildsPath);
                const projectBuildFolders = buildFolders.filter(folder => folder.startsWith(projectId));

                for (const folder of projectBuildFolders) {
                    const folderPath = path.join(buildsPath, folder);
                    await fs.remove(folderPath);
                    logger.info(`[Project ${projectId}] Removed build folder: ${folder}`);
                }
            }
        } catch (err) {
            logger.warn(`[Project ${projectId}] Failed to cleanup builds folder: ${err.message}`);
        }

        // 5. Clean up dangling Docker resources
        try {
            await execPromise(`docker image prune -f`);
            await execPromise(`docker volume prune -f`);
            await execPromise(`docker container prune -f`);
            logger.info(`[Project ${projectId}] Cleaned up dangling Docker resources`);
        } catch (err) {
            logger.warn(`[Project ${projectId}] Failed to cleanup dangling resources: ${err.message}`);
        }

        logger.info(`[Project ${projectId}] Comprehensive cleanup completed successfully`);
        return {
            success: true,
            message: 'All project resources cleaned up successfully',
            cleaned: {
                container: containerName,
                image: imageName,
                repoFolders: 'cleaned',
                buildFolders: 'cleaned',
                danglingResources: 'cleaned'
            }
        };
    } catch (error) {
        logger.error(`[Project ${projectId}] Comprehensive cleanup failed: ${error.message}`);
        throw new Error(`Comprehensive cleanup failed: ${error.message}`);
    }
};

/**
 * Export Docker management utilities
 * @module dockerHelpers
 * @description Comprehensive Docker container management for deployment operations
 */
module.exports = { deployContainer, cleanupExistingContainer, cleanupProjectContainers, getCustomDomainUrl };

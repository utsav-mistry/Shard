/**
 * @fileoverview Streaming Logger for Real-time Command Output
 * @description Enhanced streaming logger that handles real-time command execution output
 * with Socket.io integration for web-based streaming. Supports git, docker, and other CLI commands.
 * @module utils/streamingLogger
 * @requires child_process
 * @requires fs
 * @requires readline
 * @requires ./logger
 * @author Utsav Mistry
 * @version 0.2.3
 */

const { spawn } = require('child_process');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');
const logger = require('./logger');

/**
 * @class StreamingLogger
 * @classdesc Handles streaming command output with real-time processing and Socket.io integration
 * @param {Object} socket - Socket.io socket instance for real-time updates
 * @param {string} projectId - Unique identifier for the project
 * @param {string} deploymentId - Unique identifier for the deployment
 * @example
 * const logger = new StreamingLogger(socket, 'project-123', 'deploy-456');
 * await logger.executeCommand('docker', ['build', '-t', 'my-image', '.'], {
 *   cwd: '/path/to/project',
 *   step: 'build',
 *   timeout: 300000
 * });
 */
class StreamingLogger {
    constructor(socket, projectId, deploymentId) {
        this.socket = socket;
        this.projectId = projectId;
        this.deploymentId = deploymentId;
    }

    /**
     * Executes a command with real-time line-by-line output streaming
     * @async
     * @method executeCommand
     * @param {string} command - The command to execute (e.g., 'docker', 'git', 'npm')
     * @param {string[]} args - Array of command-line arguments
     * @param {Object} [options] - Command execution options
     * @param {string} [options.cwd] - Current working directory
     * @param {Object} [options.env] - Environment variables
     * @param {string} [options.step='unknown'] - Deployment step name for logging
     * @param {number} [options.timeout] - Execution timeout in milliseconds
     * @returns {Promise<Object>} Result object with exit code and error status
     * @throws {Error} If command execution fails or times out
     * @example
     * await logger.executeCommand('docker', ['build', '-t', 'my-image', '.'], {
     *   cwd: '/app',
     *   step: 'build',
     *   timeout: 300000
     * });
     */
    async executeCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const { cwd, env, step = 'unknown' } = options;
            
            logger.info(`[${this.projectId}] Starting ${step}: ${command} ${args.join(' ')}`);
            
            const child = spawn(command, args, {
                cwd,
                env: { ...process.env, ...env },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdoutBuffer = '';
            let stderrBuffer = '';
            let hasError = false;

            // Handle stdout line by line
            child.stdout.on('data', (data) => {
                stdoutBuffer += data.toString();
                this.processBuffer(stdoutBuffer, 'stdout', step, (line, remaining) => {
                    stdoutBuffer = remaining;
                    this.emitLog(line, 'info', step);
                });
            });

            // Handle stderr line by line
            child.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
                this.processBuffer(stderrBuffer, 'stderr', step, (line, remaining) => {
                    stderrBuffer = remaining;
                    this.emitLog(line, 'error', step);
                    hasError = true;
                });
            });

            // Handle process completion
            child.on('close', (code) => {
                // Process any remaining buffer content
                if (stdoutBuffer.trim()) {
                    this.emitLog(stdoutBuffer.trim(), 'info', step);
                }
                if (stderrBuffer.trim()) {
                    this.emitLog(stderrBuffer.trim(), 'error', step);
                }

                const message = `Process ${step} exited with code ${code}`;
                logger.info(`[${this.projectId}] ${message}`);
                
                if (code === 0) {
                    this.emitLog(message, 'success', step);
                    resolve({ code, hasError });
                } else {
                    this.emitLog(`${message} - FAILED`, 'error', step);
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            // Handle process errors
            child.on('error', (error) => {
                const message = `Process error in ${step}: ${error.message}`;
                logger.error(`[${this.projectId}] ${message}`);
                this.emitLog(message, 'error', step);
                reject(error);
            });

            // Handle timeout if specified
            if (options.timeout) {
                setTimeout(() => {
                    child.kill('SIGTERM');
                    const message = `Process ${step} timed out after ${options.timeout}ms`;
                    logger.error(`[${this.projectId}] ${message}`);
                    this.emitLog(message, 'error', step);
                    reject(new Error(message));
                }, options.timeout);
            }
        });
    }

    /**
     * Processes buffer content line by line
     * @private
     * @method processBuffer
     * @param {string} buffer - The buffer containing command output
     * @param {string} source - Output source ('stdout' or 'stderr')
     * @param {string} step - Current deployment step
     * @param {Function} callback - Callback to process each complete line
     * @returns {void}
     */
    processBuffer(buffer, source, step, callback) {
        const lines = buffer.split('\n');
        const remaining = lines.pop(); // Keep incomplete line in buffer
        
        lines.forEach(line => {
            if (line.trim()) {
                callback(line, remaining);
            }
        });
    }

    /**
     * Emits log message to frontend via Socket.io
     * @private
     * @method emitLog
     * @param {string} message - The log message to emit
     * @param {string} [level='info'] - Log level ('info', 'error', 'success')
     * @param {string} [step='unknown'] - Deployment step name
     * @returns {void}
     */
    emitLog(message, level = 'info', step = 'unknown') {
        const timestamp = new Date().toISOString();
        
        /**
         * Formats a technical message into user-friendly format
         * @private
         * @method formatUserFriendlyMessage
         * @param {string} rawMessage - The raw message from command output
         * @param {string} currentStep - Current deployment step
         * @returns {string} Formatted user-friendly message
         * @description Converts technical command output into human-readable messages
         * that are more understandable for end users.
         */
        const formatUserFriendlyMessage = (rawMessage, currentStep) => {
            const msg = rawMessage.trim();
            
            // Git clone messages
            if (msg.includes('Cloning into')) {
                return 'Downloading your project code from repository...';
            }
            if (msg.includes('remote: Enumerating objects')) {
                return 'Preparing to download project files...';
            }
            if (msg.includes('Receiving objects:') && msg.includes('%')) {
                const match = msg.match(/(\d+)%/);
                const percentage = match ? match[1] : '0';
                return `Downloading project files... ${percentage}%`;
            }
            if (msg.includes('Resolving deltas:')) {
                return 'Processing downloaded files...';
            }
            
            // Docker build messages
            if (msg.includes('Successfully built')) {
                return 'Application built successfully!';
            }
            if (msg.includes('Successfully tagged')) {
                return 'Application packaged and ready for deployment';
            }
            if (msg.startsWith('Step ') && msg.includes('FROM')) {
                return 'Setting up build environment...';
            }
            if (msg.startsWith('Step ') && msg.includes('WORKDIR')) {
                return 'Configuring workspace...';
            }
            if (msg.startsWith('Step ') && msg.includes('COPY')) {
                return 'Copying application files...';
            }
            if (msg.startsWith('Step ') && msg.includes('RUN npm install')) {
                return 'Installing project dependencies...';
            }
            if (msg.startsWith('Step ') && msg.includes('RUN yarn install')) {
                return 'Installing project dependencies...';
            }
            if (msg.startsWith('Step ') && msg.includes('RUN npm run build')) {
                return 'Building application for production...';
            }
            if (msg.startsWith('Step ') && msg.includes('RUN yarn build')) {
                return 'Building application for production...';
            }
            if (msg.startsWith('Step ') && msg.includes('EXPOSE')) {
                return 'Configuring network access...';
            }
            if (msg.startsWith('Step ') && msg.includes('CMD')) {
                return 'Setting up application startup...';
            }
            if (msg.includes('---> Running in')) {
                return 'Executing build step...';
            }
            if (msg.includes('Removing intermediate container')) {
                return 'Cleaning up build artifacts...';
            }
            
            // Docker run messages
            if (msg.includes('docker run') && currentStep === 'deploy') {
                return 'Starting your application container...';
            }
            if (msg.includes('Container') && msg.includes('started')) {
                return 'Application is now running!';
            }
            
            // npm/yarn output
            if (msg.includes('npm WARN') || msg.includes('yarn warning')) {
                return 'Installing dependencies (some warnings are normal)...';
            }
            if (msg.includes('added') && msg.includes('packages')) {
                const match = msg.match(/added (\d+) packages/);
                const count = match ? match[1] : 'multiple';
                return `Installed ${count} dependencies successfully`;
            }
            
            // Environment setup
            if (msg.includes('Creating .env file')) {
                return 'Setting up environment variables...';
            }
            if (msg.includes('Environment variables injected')) {
                return 'Environment configuration applied';
            }
            
            // Error handling
            if (level === 'error') {
                if (msg.includes('ENOENT') || msg.includes('No such file')) {
                    return 'Missing required file - please check your project structure';
                }
                if (msg.includes('EACCES') || msg.includes('permission denied')) {
                    return 'Permission error - deployment system needs access';
                }
                if (msg.includes('network') || msg.includes('timeout')) {
                    return 'Network connectivity issue - retrying...';
                }
                return `Build error: ${msg}`;
            }
            
            // Success messages
            if (level === 'success') {
                return `✅ ${msg}`;
            }
            
            // Filter out very technical Docker output
            if (msg.includes('sha256:') || msg.includes('digest:') || msg.length > 100) {
                return null; // Skip overly technical messages
            }
            
            // Return cleaned message for anything else
            return msg;
        };

        const userFriendlyMessage = formatUserFriendlyMessage(message, step);
        
        // Skip null messages (filtered out technical noise)
        if (userFriendlyMessage === null) {
            return;
        }

        const logEntry = {
            projectId: this.projectId,
            deploymentId: this.deploymentId,
            step,
            level,
            message: userFriendlyMessage,
            timestamp
        };

        // Emit to Socket.io
        if (this.socket) {
            this.socket.emit('deployment-log', logEntry);
        }

        // Also log to console for debugging (with original message)
        logger.info(`[${this.projectId}][${step}] ${message.trim()}`);
    }

    /**
     * Clones a repository with real-time streaming
     * @async
     * @method cloneRepository
     * @param {string} repoUrl - URL of the repository to clone
     * @param {string} targetPath - Path to clone the repository into
     * @param {string} [branch='main'] - Branch to clone
     * @returns {Promise<Object>} Result object with success status and cloned path
     * @throws {Error} If cloning fails
     */
    async cloneRepository(repoUrl, targetPath, branch = 'main') {
        this.emitLog(`Starting repository clone: ${repoUrl}`, 'info', 'clone');
        
        const args = ['clone', '--progress', '--branch', branch, repoUrl, targetPath];
        
        try {
            await this.executeCommand('git', args, {
                step: 'clone',
                timeout: 300000 // 5 minutes timeout
            });
            
            this.emitLog(`Repository cloned successfully to ${targetPath}`, 'success', 'clone');
            return { success: true, path: targetPath };
        } catch (error) {
            this.emitLog(`Repository clone failed: ${error.message}`, 'error', 'clone');
            throw error;
        }
    }

    /**
     * Builds a Docker image with streaming output
     * @async
     * @method buildDockerImage
     * @param {string} contextPath - Path to the build context
     * @param {string} dockerfilePath - Path to the Dockerfile
     * @param {string} imageName - Name for the built image
     * @returns {Promise<void>}
     * @throws {Error} If the build fails
     */
    async buildDockerImage(contextPath, dockerfilePath, imageName) {
        // Check if project image already exists
        const imageExists = await this.checkImageExists(imageName);
        
        if (imageExists && imageName.includes('shard-project-')) {
            this.emitLog(`Using existing project image: ${imageName}`, 'success', 'build');
            return { success: true, imageName, reused: true };
        }
        
        this.emitLog(`Building Docker image: ${imageName}`, 'info', 'build');
        
        // Clean up old images with the same name first
        await this.cleanupOldImages(imageName);
        
        const args = ['build', '-f', dockerfilePath, '-t', imageName, contextPath];
        
        try {
            await this.executeCommand('docker', args, {
                step: 'build',
                cwd: contextPath,
                timeout: 600000 // 10 minutes timeout
            });
            
            this.emitLog(`Docker image built successfully: ${imageName}`, 'success', 'build');
            
            // Clean up dangling images after successful build
            await this.cleanupDanglingImages();
            
            return { success: true, imageName, reused: false };
        } catch (error) {
            this.emitLog(`Docker build failed: ${error.message}`, 'error', 'build');
            throw error;
        }
    }

    /**
     * Checks if a Docker image exists
     * @async
     * @method checkImageExists
     * @param {string} imageName - Name of the image to check
     * @returns {Promise<boolean>} True if the image exists
     */
    async checkImageExists(imageName) {
        try {
            await this.executeCommand('docker', ['image', 'inspect', imageName], {
                step: 'check',
                timeout: 10000
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Cleans up old images with the same name (skip for project-based images)
     * @async
     * @method cleanupOldImages
     * @param {string} imageName - Name of the image to clean up
     * @returns {Promise<void>}
     */
    async cleanupOldImages(imageName) {
        // Don't clean up project images - reuse them for efficiency
        if (imageName.includes('shard-project-')) {
            this.emitLog(`Reusing existing project image: ${imageName}`, 'info', 'build');
            return;
        }
        
        try {
            this.emitLog(`Cleaning up old images for: ${imageName}`, 'info', 'cleanup');
            await this.executeCommand('docker', ['rmi', imageName], {
                step: 'cleanup',
                timeout: 30000
            });
        } catch (error) {
            // Ignore errors - image might not exist
            this.emitLog(`No existing image to clean up: ${imageName}`, 'info', 'cleanup');
        }
    }

    /**
     * Cleans up dangling images
     * @async
     * @method cleanupDanglingImages
     * @returns {Promise<void>}
     */
    async cleanupDanglingImages() {
        try {
            this.emitLog(`Cleaning up dangling images`, 'info', 'cleanup');
            await this.executeCommand('docker', ['image', 'prune', '-f'], {
                step: 'cleanup',
                timeout: 60000
            });
            this.emitLog(`Dangling images cleaned up`, 'success', 'cleanup');
        } catch (error) {
            this.emitLog(`Failed to clean dangling images: ${error.message}`, 'warning', 'cleanup');
        }
    }

    /**
     * Runs a Docker container with streaming output
     * @async
     * @method runDockerContainer
     * @param {string} imageName - Name of the Docker image to run
     * @param {string} containerName - Name to assign to the container
     * @param {Object} options - Container options
     * @param {Array<Object>} options.ports - Port mappings
     * @param {string} [options.envFile] - Path to .env file
     * @param {string} [options.memory] - Memory limit (e.g., '512m')
     * @returns {Promise<void>}
     * @throws {Error} If container fails to start
     */
    async runDockerContainer(imageName, containerName, options = {}) {
        this.emitLog(`Starting Docker container: ${containerName}`, 'info', 'deploy');
        
        const { ports = [], envFile, memory = '512m' } = options;
        
        // Build docker run command with restart policy
        const args = ['run', '-d', `--memory=${memory}`, '--restart=unless-stopped', '--name', containerName];
        
        // Add port mappings
        ports.forEach(({ host, container }) => {
            args.push('-p', `${host}:${container}`);
        });
        
        // Add environment file if provided
        if (envFile) {
            args.push('--env-file', envFile);
        }
        
        args.push(imageName);
        
        try {
            await this.executeCommand('docker', args, {
                step: 'deploy',
                timeout: 120000 // 2 minutes timeout
            });
            
            this.emitLog(`Container started successfully: ${containerName}`, 'success', 'deploy');
            
            // Wait a moment for container to fully start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify container is running
            const isRunning = await this.verifyContainerRunning(containerName);
            if (!isRunning) {
                throw new Error(`Container ${containerName} failed to start or exited immediately`);
            }
            
            // Start streaming runtime logs
            this.streamRuntimeLogs(containerName);
            
            return { success: true, containerName };
        } catch (error) {
            this.emitLog(`Container deployment failed: ${error.message}`, 'error', 'deploy');
            throw error;
        }
    }

    /**
     * Verifies a container is running
     * @async
     * @method verifyContainerRunning
     * @param {string} containerName - Name of the container to verify
     * @returns {Promise<boolean>} True if the container is running
     */
    async verifyContainerRunning(containerName) {
        try {
            await this.executeCommand('docker', ['ps', '-q', '-f', `name=${containerName}`], {
                step: 'verify',
                timeout: 10000
            });
            return true;
        } catch (error) {
            this.emitLog(`Container verification failed: ${error.message}`, 'error', 'verify');
            return false;
        }
    }

    /**
     * Streams runtime logs from a running container
     * @method streamRuntimeLogs
     * @param {string} containerName - Name of the container to stream logs from
     * @returns {void}
     */
    streamRuntimeLogs(containerName) {
        this.emitLog(`Starting runtime log streaming for ${containerName}`, 'info', 'runtime');
        
        const child = spawn('docker', ['logs', '-f', containerName], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdoutBuffer = '';
        let stderrBuffer = '';

        /**
         * Handles stdout line by line
         * @event child.stdout#data
         * @param {Buffer} data - The data from stdout
         */
        child.stdout.on('data', (data) => {
            stdoutBuffer += data.toString();
            this.processBuffer(stdoutBuffer, 'stdout', 'runtime', (line, remaining) => {
                stdoutBuffer = remaining;
                this.emitLog(`[RUNTIME] ${line}`, 'info', 'runtime');
            });
        });

        /**
         * Handles stderr line by line
         * @event child.stderr#data
         * @param {Buffer} data - The data from stderr
         */
        child.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
            this.processBuffer(stderrBuffer, 'stderr', 'runtime', (line, remaining) => {
                stderrBuffer = remaining;
                this.emitLog(`[RUNTIME ERROR] ${line}`, 'error', 'runtime');
            });
        });

        /**
         * Handles process completion
         * @event child#close
         * @param {number} code - The exit code of the process
         */
        child.on('close', (code) => {
            this.emitLog(`Runtime log streaming ended for ${containerName} (code: ${code})`, 'info', 'runtime');
        });

        /**
         * Handles process errors
         * @event child#error
         * @param {Error} error - The error that occurred
         */
        child.on('error', (error) => {
            this.emitLog(`Runtime log streaming error: ${error.message}`, 'error', 'runtime');
        });

        // Store child process reference for cleanup
        this.runtimeLogProcess = child;
    }

    /**
     * Stops runtime log streaming
     * @method stopRuntimeLogs
     * @returns {void}
     */
    stopRuntimeLogs() {
        if (this.runtimeLogProcess) {
            this.runtimeLogProcess.kill('SIGTERM');
            this.runtimeLogProcess = null;
            this.emitLog('Runtime log streaming stopped', 'info', 'runtime');
        }
    }

    /**
     * Cleans up a Docker container by name
     * @async
     * @method cleanupContainer
     * @param {string} containerName - Name of the container to clean up
     * @returns {Promise<boolean>} True if cleanup was successful
     * @description Stops and removes a Docker container if it exists
     */
    async cleanupContainer(containerName) {
        this.emitLog(`Cleaning up existing container: ${containerName}`, 'info', 'cleanup');
        
        try {
            await this.executeCommand('docker', ['rm', '-f', containerName], {
                step: 'cleanup',
                timeout: 30000 // 30 seconds timeout
            });
            this.emitLog(`Container cleaned up: ${containerName}`, 'success', 'cleanup');
        } catch (error) {
            // Don't fail if container doesn't exist
            if (error.message.includes('No such container')) {
                this.emitLog(`No existing container to clean up: ${containerName}`, 'info', 'cleanup');
            } else {
                this.emitLog(`Container cleanup failed: ${error.message}`, 'error', 'cleanup');
                throw error;
            }
        }
    }
}

/**
 * @module streamingLogger
 * @description Exports the StreamingLogger class for real-time command output streaming
 */
module.exports = StreamingLogger;

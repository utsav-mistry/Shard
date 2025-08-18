const { spawn } = require('child_process');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');
const logger = require('../utils/logger');

/**
 * Enhanced streaming logger for real-time line-by-line command output
 * Handles git clone, docker build, and docker run with Socket.io integration
 */

class StreamingLogger {
    constructor(socket, projectId, deploymentId) {
        this.socket = socket;
        this.projectId = projectId;
        this.deploymentId = deploymentId;
    }

    /**
     * Execute command with real-time line-by-line streaming
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
     * Process buffer content line by line
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
     * Emit log to frontend via Socket.io
     */
    emitLog(message, level = 'info', step = 'unknown') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            projectId: this.projectId,
            deploymentId: this.deploymentId,
            step,
            level,
            message: message.trim(),
            timestamp
        };

        // Emit to Socket.io
        if (this.socket) {
            this.socket.emit('deployment-log', logEntry);
        }

        // Also log to console for debugging
        logger.info(`[${this.projectId}][${step}] ${message.trim()}`);
    }

    /**
     * Clone repository with real-time streaming
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
     * Build Docker image with real-time streaming
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
     * Check if Docker image exists
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
     * Clean up old images with the same name (skip for project-based images)
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
     * Clean up dangling images
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
     * Run Docker container with real-time streaming
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
     * Verify container is running
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
     * Stream runtime logs from running container
     */
    streamRuntimeLogs(containerName) {
        this.emitLog(`Starting runtime log streaming for ${containerName}`, 'info', 'runtime');
        
        const child = spawn('docker', ['logs', '-f', containerName], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdoutBuffer = '';
        let stderrBuffer = '';

        child.stdout.on('data', (data) => {
            stdoutBuffer += data.toString();
            this.processBuffer(stdoutBuffer, 'stdout', 'runtime', (line, remaining) => {
                stdoutBuffer = remaining;
                this.emitLog(`[RUNTIME] ${line}`, 'info', 'runtime');
            });
        });

        child.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
            this.processBuffer(stderrBuffer, 'stderr', 'runtime', (line, remaining) => {
                stderrBuffer = remaining;
                this.emitLog(`[RUNTIME ERROR] ${line}`, 'error', 'runtime');
            });
        });

        child.on('close', (code) => {
            this.emitLog(`Runtime log streaming ended for ${containerName} (code: ${code})`, 'info', 'runtime');
        });

        child.on('error', (error) => {
            this.emitLog(`Runtime log streaming error: ${error.message}`, 'error', 'runtime');
        });

        // Store child process reference for cleanup
        this.runtimeLogProcess = child;
    }

    /**
     * Stop runtime log streaming
     */
    stopRuntimeLogs() {
        if (this.runtimeLogProcess) {
            this.runtimeLogProcess.kill('SIGTERM');
            this.runtimeLogProcess = null;
            this.emitLog('Runtime log streaming stopped', 'info', 'runtime');
        }
    }

    /**
     * Clean up existing container
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

module.exports = StreamingLogger;

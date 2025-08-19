/**
 * @fileoverview Docker Daemon Status Checker
 * @description Utilities for checking Docker daemon availability and environment validation
 * @author Utsav Mistry
 * @version 0.2.3
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Check if Docker daemon is running and accessible
 * @async
 * @function isDockerRunning
 * @returns {Promise<boolean>} True if Docker daemon is available, false otherwise
 * @throws {Error} Command execution errors (caught internally)
 * @description Tests Docker daemon accessibility using multiple fallback commands.
 * Tries 'docker info' first, then falls back to 'docker ps' for Windows compatibility.
 * @example
 * const dockerAvailable = await isDockerRunning();
 * if (dockerAvailable) {
 *   console.log('Docker is ready for deployments');
 * }
 */
const isDockerRunning = async () => {
    try {
        // Try to run a simple Docker command to check if daemon is accessible
        // Use docker info instead of docker version for better compatibility
        const { stdout } = await execPromise('docker info --format "{{.ServerVersion}}"', { timeout: 10000 });
        return stdout && stdout.trim().length > 0;
    } catch (error) {
        // Try alternative command for Windows
        try {
            await execPromise('docker ps', { timeout: 5000 });
            return true;
        } catch (fallbackError) {
            return false;
        }
    }
};

/**
 * Check Docker daemon status with comprehensive logging
 * @async
 * @function checkDockerStatus
 * @returns {Promise<boolean>} True if Docker is available, false otherwise
 * @description Checks Docker availability and provides detailed error messages with platform-specific instructions.
 * Logs both to logger and console for maximum visibility when Docker is unavailable.
 * @example
 * const dockerReady = await checkDockerStatus();
 * if (!dockerReady) {
 *   // Handle Docker unavailable scenario
 *   return;
 * }
 * // Proceed with Docker operations
 */
const checkDockerStatus = async () => {
    const isRunning = await isDockerRunning();
    
    if (!isRunning) {
        logger.error('DOCKER DAEMON NOT RUNNING!');
        logger.error('Please start Docker Desktop or Docker daemon before deploying');
        logger.error('On Windows: Start Docker Desktop application');
        logger.error('On Linux: Run "sudo systemctl start docker"');
        logger.error('On macOS: Start Docker Desktop application');

        // Also log to console for immediate visibility
        console.error('\n DEPLOYMENT FAILED: DOCKER NOT RUNNING ');
        console.error('Docker daemon is not accessible');
        console.error('Please start Docker and try again:');
        
        return false;
    }
    
    logger.info('Docker daemon is running and accessible');
    return true;
};

/**
 * Validate Docker environment before deployment operations
 * @async
 * @function validateDockerEnvironment
 * @returns {Promise<boolean>} True if Docker environment is valid
 * @throws {Error} When Docker daemon is not running or accessible
 * @description Validates Docker environment and throws descriptive error if unavailable.
 * Used as a pre-deployment check to ensure Docker operations will succeed.
 * @example
 * try {
 *   await validateDockerEnvironment();
 *   // Proceed with deployment
 * } catch (error) {
 *   console.error('Docker validation failed:', error.message);
 * }
 */
const validateDockerEnvironment = async () => {
    const isAvailable = await checkDockerStatus();
    
    if (!isAvailable) {
        throw new Error('Docker daemon is not running. Please start Docker Desktop or Docker daemon and try again.');
    }
    
    return true;
};

/**
 * Export Docker checking utilities
 * @module dockerChecker
 * @description Docker daemon status checking and environment validation utilities
 */
module.exports = {
    isDockerRunning,
    checkDockerStatus,
    validateDockerEnvironment
};

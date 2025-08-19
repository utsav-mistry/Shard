const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Check if Docker daemon is running
 * @returns {Promise<boolean>} True if Docker is available, false otherwise
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
 * Check Docker daemon status and log appropriate messages
 * @returns {Promise<boolean>} True if Docker is available, false otherwise
 */
const checkDockerStatus = async () => {
    const isRunning = await isDockerRunning();
    
    if (!isRunning) {
        logger.error('🐳 DOCKER DAEMON NOT RUNNING!');
        logger.error('❌ Please start Docker Desktop or Docker daemon before deploying');
        logger.error('💡 On Windows: Start Docker Desktop application');
        logger.error('💡 On Linux: Run "sudo systemctl start docker"');
        logger.error('💡 On macOS: Start Docker Desktop application');
        
        // Also log to console for immediate visibility
        console.error('\n🚨 DEPLOYMENT FAILED: DOCKER NOT RUNNING 🚨');
        console.error('🐳 Docker daemon is not accessible');
        console.error('📋 Please start Docker and try again:');
        console.error('   • Windows/macOS: Start Docker Desktop');
        console.error('   • Linux: sudo systemctl start docker\n');
        
        return false;
    }
    
    logger.info('🐳 Docker daemon is running and accessible');
    return true;
};

/**
 * Validate Docker environment before deployment
 * Throws error with clear message if Docker is not available
 */
const validateDockerEnvironment = async () => {
    const isAvailable = await checkDockerStatus();
    
    if (!isAvailable) {
        throw new Error('Docker daemon is not running. Please start Docker Desktop or Docker daemon and try again.');
    }
    
    return true;
};

module.exports = {
    isDockerRunning,
    checkDockerStatus,
    validateDockerEnvironment
};

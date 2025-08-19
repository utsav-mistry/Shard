/**
 * @fileoverview Reverse Proxy Manager Service
 * @description Manages Nginx reverse proxy container and port allocation for deployments
 * @author Utsav Mistry
 * @version 0.2.3
 */

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const proxyConfig = require('./proxyConfig');

/**
 * Reverse proxy manager for deployment routing
 * @class ReverseProxyManager
 * @description Manages Nginx reverse proxy container, port allocation, and subdomain routing.
 * Handles dynamic configuration updates and container lifecycle management.
 * @example
 * const proxyManager = require('./reverseProxyManager');
 * await proxyManager.initialize();
 * const port = await proxyManager.allocatePort('myapp', 'mern');
 * await proxyManager.updateNginxConfig('myapp', 'mern', port);
 */
class ReverseProxyManager {
    /**
     * Initialize reverse proxy manager
     * @description Sets up container name, configuration paths, and port ranges
     */
    constructor() {
        this.nginxContainerName = 'shard-reverse-proxy';
        this.nginxConfigPath = path.join(__dirname, '..', 'nginx', 'nginx.conf');
        this.portRanges = {
            flask: { start: 15000, end: 15999 },
            django: { start: 16000, end: 16999 },
            mern: { start: 17000, end: 17999 }
        };
        this.allocatedPorts = new Map(); // subdomain -> port mapping
    }

    /**
     * Get next available internal port for a technology stack
     * @async
     * @function getNextInternalPort
     * @param {string} stack - Technology stack ('flask', 'django', 'mern')
     * @returns {Promise<number>} Next available port in stack's range
     * @throws {Error} If no ports available or invalid stack
     * @description Finds first available port within stack's allocated range
     */
    async getNextInternalPort(stack) {
        const range = this.portRanges[stack];
        if (!range) {
            throw new Error(`No port range defined for stack: ${stack}`);
        }

        for (let port = range.start; port <= range.end; port++) {
            if (!this.isPortAllocated(port)) {
                return port;
            }
        }
        
        throw new Error(`No available ports in range ${range.start}-${range.end} for ${stack}`);
    }

    /**
     * Check if port is already allocated
     * @function isPortAllocated
     * @param {number} port - Port number to check
     * @returns {boolean} True if port is allocated
     * @description Checks if port is currently allocated to any subdomain
     */
    isPortAllocated(port) {
        return Array.from(this.allocatedPorts.values()).includes(port);
    }

    /**
     * Allocate internal port for deployment
     * @async
     * @function allocatePort
     * @param {string} subdomain - Subdomain name
     * @param {string} stack - Technology stack
     * @returns {Promise<number>} Allocated port number
     * @description Allocates next available port for subdomain deployment
     */
    async allocatePort(subdomain, stack) {
        const port = await this.getNextInternalPort(stack);
        
        this.allocatedPorts.set(subdomain, port);
        logger.info(`[Reverse Proxy] Allocated internal port ${port} for ${subdomain} (${stack})`);
        
        return port;
    }

    /**
     * Get allocated port for subdomain
     * @function getAllocatedPort
     * @param {string} subdomain - Subdomain name
     * @returns {number|undefined} Allocated port or undefined if not found
     * @description Retrieves currently allocated port for subdomain
     */
    getAllocatedPort(subdomain) {
        return this.allocatedPorts.get(subdomain);
    }

    /**
     * Release port allocation for subdomain
     * @function releasePort
     * @param {string} subdomain - Subdomain name
     * @returns {number|undefined} Released port number
     * @description Releases port allocation and makes it available for reuse
     */
    releasePort(subdomain) {
        const port = this.allocatedPorts.get(subdomain);
        
        if (port) {
            this.allocatedPorts.delete(subdomain);
            logger.info(`[Reverse Proxy] Released port ${port} for ${subdomain}`);
        }
        
        return port;
    }

    /**
     * Start reverse proxy container
     * @async
     * @function startReverseProxy
     * @returns {Promise<boolean>} True if started successfully
     * @throws {Error} Docker or container startup errors
     * @description Builds and starts Nginx reverse proxy container with port mappings
     */
    async startReverseProxy() {
        try {
            // Check if reverse proxy is already running
            const isRunning = await this.isReverseProxyRunning();
            if (isRunning) {
                logger.info('[Reverse Proxy] Already running');
                return true;
            }

            // Build reverse proxy image
            const dockerfilePath = path.join(__dirname, '..', 'dockerfiles', 'Dockerfile.nginx');
            const contextPath = path.join(__dirname, '..');
            
            logger.info('[Reverse Proxy] Building reverse proxy image...');
            await this.execPromise(`docker build -f ${dockerfilePath} -t shard-reverse-proxy ${contextPath}`);
            
            // Start reverse proxy container with volume mount for dynamic config
            logger.info('[Reverse Proxy] Starting reverse proxy container...');
            const configDir = path.join(__dirname, '..', 'nginx');
            const dockerCmd = [
                'docker run -d',
                '--name', this.nginxContainerName,
                '--restart=unless-stopped',
                '-p 12000:12000',  // MERN
                '-p 13000:13000',  // Django
                '-p 14000:14000',  // Flask
                '--add-host=host.docker.internal:host-gateway',
                `-v "${configDir}:/etc/nginx/dynamic"`,
                'shard-reverse-proxy'
            ].join(' ');
            
            await this.execPromise(dockerCmd);
            logger.info('[Reverse Proxy] Reverse proxy started successfully');
            
            return true;
        } catch (error) {
            logger.error(`[Reverse Proxy] Failed to start: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if reverse proxy container is running
     * @async
     * @function isReverseProxyRunning
     * @returns {Promise<boolean>} True if container is running
     * @description Checks Docker container status for reverse proxy
     */
    async isReverseProxyRunning() {
        try {
            const result = await this.execPromise(`docker ps -q -f name=${this.nginxContainerName}`);
            return result.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Stop reverse proxy container
     * @async
     * @function stopReverseProxy
     * @description Forcefully removes reverse proxy container
     */
    async stopReverseProxy() {
        try {
            await this.execPromise(`docker rm -f ${this.nginxContainerName}`);
            logger.info('[Reverse Proxy] Stopped reverse proxy');
        } catch (error) {
            logger.warn(`[Reverse Proxy] Failed to stop: ${error.message}`);
        }
    }

    /**
     * Update Nginx configuration with new upstream
     * @async
     * @function updateNginxConfig
     * @param {string} subdomain - Subdomain name
     * @param {string} stack - Technology stack
     * @param {number} internalPort - Internal port number
     * @returns {Promise<boolean>} True if updated successfully
     * @description Adds subdomain mapping and reloads Nginx configuration
     */
    async updateNginxConfig(subdomain, stack, internalPort) {
        try {
            // Add mapping to proxy config
            proxyConfig.addMapping(subdomain, stack, internalPort);
            
            // Reload nginx configuration
            await this.reloadNginxConfig();
            
            logger.info(`[Reverse Proxy] Registered ${subdomain} -> ${stack}:${internalPort}`);
            
            return true;
        } catch (error) {
            logger.error(`[Reverse Proxy] Failed to update config: ${error.message}`);
            throw error;
        }
    }

    /**
     * Reload Nginx configuration
     * @async
     * @function reloadNginxConfig
     * @description Tests and reloads Nginx configuration, restarts container if needed
     */
    async reloadNginxConfig() {
        try {
            const isRunning = await this.isReverseProxyRunning();
            if (isRunning) {
                // Wait a moment for the file to be written
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Test nginx configuration first
                await this.execPromise(`docker exec ${this.nginxContainerName} nginx -t`);
                
                // Reload if configuration is valid
                await this.execPromise(`docker exec ${this.nginxContainerName} nginx -s reload`);
                logger.info('[Reverse Proxy] Configuration reloaded');
            }
        } catch (error) {
            logger.warn(`[Reverse Proxy] Failed to reload config: ${error.message}`);
            
            // If reload fails, try restarting the container
            try {
                logger.info('[Reverse Proxy] Attempting container restart...');
                await this.execPromise(`docker restart ${this.nginxContainerName}`);
                logger.info('[Reverse Proxy] Container restarted successfully');
            } catch (restartError) {
                logger.error(`[Reverse Proxy] Container restart failed: ${restartError.message}`);
            }
        }
    }

    /**
     * Get public URL for deployment
     * @function getPublicUrl
     * @param {string} subdomain - Subdomain name
     * @param {string} stack - Technology stack
     * @returns {string} Public URL for accessing deployment
     * @description Constructs public URL based on subdomain and stack port mapping
     */
    getPublicUrl(subdomain, stack) {
        const portMap = {
            flask: 14000,
            django: 13000,
            mern: 12000
        };
        
        const port = portMap[stack];
        return `http://${subdomain}.localhost:${port}`;
    }

    /**
     * Execute shell command as Promise
     * @function execPromise
     * @param {string} cmd - Shell command to execute
     * @returns {Promise<string>} Command stdout
     * @throws {Error} Command execution errors
     * @description Promisified wrapper for child_process.exec
     */
    execPromise(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    logger.error(`Command failed: ${cmd}`);
                    logger.error(`Error: ${stderr}`);
                    return reject(err);
                }
                resolve(stdout);
            });
        });
    }

    /**
     * Initialize reverse proxy manager
     * @async
     * @function initialize
     * @description Loads existing mappings and starts reverse proxy container
     */
    async initialize() {
        try {
            logger.info('[Reverse Proxy] Initializing reverse proxy manager...');
            
            // Load existing mappings
            proxyConfig.loadMappings();
            
            await this.startReverseProxy();
            logger.info('[Reverse Proxy] Reverse proxy manager initialized');
        } catch (error) {
            logger.error(`[Reverse Proxy] Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cleanup reverse proxy resources
     * @async
     * @function cleanup
     * @description Stops container and clears port allocations on shutdown
     */
    async cleanup() {
        try {
            logger.info('[Reverse Proxy] Cleaning up reverse proxy...');
            await this.stopReverseProxy();
            this.allocatedPorts.clear();
            logger.info('[Reverse Proxy] Cleanup completed');
        } catch (error) {
            logger.error(`[Reverse Proxy] Cleanup failed: ${error.message}`);
        }
    }
}

/**
 * Singleton reverse proxy manager instance
 * @type {ReverseProxyManager}
 * @description Global instance for managing reverse proxy operations
 */
const reverseProxyManager = new ReverseProxyManager();

/**
 * Export reverse proxy manager singleton
 * @module reverseProxyManager
 * @description Nginx reverse proxy container and port management service
 */
module.exports = reverseProxyManager;

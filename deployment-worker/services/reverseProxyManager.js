const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const proxyConfig = require('./proxyConfig');

class ReverseProxyManager {
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

    // Get next available internal port for a tech stack
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

    // Check if port is already allocated
    isPortAllocated(port) {
        return Array.from(this.allocatedPorts.values()).includes(port);
    }

    // Allocate internal port for deployment
    async allocatePort(subdomain, stack) {
        const port = await this.getNextInternalPort(stack);
        
        this.allocatedPorts.set(subdomain, port);
        logger.info(`[Reverse Proxy] Allocated internal port ${port} for ${subdomain} (${stack})`);
        
        return port;
    }

    // Get allocated port for subdomain
    getAllocatedPort(subdomain) {
        return this.allocatedPorts.get(subdomain);
    }

    // Release port allocation
    releasePort(subdomain) {
        const port = this.allocatedPorts.get(subdomain);
        
        if (port) {
            this.allocatedPorts.delete(subdomain);
            logger.info(`[Reverse Proxy] Released port ${port} for ${subdomain}`);
        }
        
        return port;
    }

    // Start reverse proxy container
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

    // Check if reverse proxy is running
    async isReverseProxyRunning() {
        try {
            const result = await this.execPromise(`docker ps -q -f name=${this.nginxContainerName}`);
            return result.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    // Stop reverse proxy
    async stopReverseProxy() {
        try {
            await this.execPromise(`docker rm -f ${this.nginxContainerName}`);
            logger.info('[Reverse Proxy] Stopped reverse proxy');
        } catch (error) {
            logger.warn(`[Reverse Proxy] Failed to stop: ${error.message}`);
        }
    }

    // Update nginx configuration with new upstream
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

    // Reload nginx configuration
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

    // Get public URL for deployment
    getPublicUrl(subdomain, stack) {
        const portMap = {
            flask: 14000,
            django: 13000,
            mern: 12000
        };
        
        const port = portMap[stack];
        return `http://${subdomain}.localhost:${port}`;
    }

    // Utility function to execute commands
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

    // Initialize reverse proxy on startup
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

    // Cleanup on shutdown
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

// Singleton instance
const reverseProxyManager = new ReverseProxyManager();

module.exports = reverseProxyManager;

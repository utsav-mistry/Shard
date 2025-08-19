const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Dynamic Nginx configuration generator for subdomain routing
 * This creates a simple mapping file that can be used by nginx for routing
 */
class ProxyConfig {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'nginx', 'proxy-mappings.conf');
        this.mappings = new Map(); // subdomain -> { stack, port }
    }

    // Add a new subdomain mapping
    addMapping(subdomain, stack, port) {
        this.mappings.set(subdomain, {
            stack,
            port
        });

        logger.info(`[Proxy Config] Added mapping: ${subdomain} -> ${stack}:${port}`);
        this.generateConfig();
    }

    // Remove a subdomain mapping
    removeMapping(subdomain) {
        if (this.mappings.has(subdomain)) {
            this.mappings.delete(subdomain);
            logger.info(`[Proxy Config] Removed mapping for: ${subdomain}`);
            this.generateConfig();
        }
    }

    // Generate nginx configuration file
    generateConfig() {
        const configLines = [];

        // Add header
        configLines.push('# Auto-generated proxy mappings');
        configLines.push('# This file is dynamically updated by the deployment worker');
        configLines.push('');

        // Generate map block for subdomain to port mapping
        configLines.push('map $host $backend_port {');
        configLines.push('    default 0;');

        for (const [subdomain, config] of this.mappings) {
            configLines.push(`    ${subdomain}.localhost ${config.port};`);
        }

        configLines.push('}');
        configLines.push('');

        // Generate map block for frontend ports (kept for compatibility, but MERN no longer uses separate frontend ports)
        configLines.push('map $host $frontend_port {');
        configLines.push('    default 0;');
        configLines.push('}');
        configLines.push('');

        // Write to file
        const configContent = configLines.join('\n');

        try {
            fs.writeFileSync(this.configPath, configContent, 'utf8');
            logger.info(`[Proxy Config] Updated configuration file: ${this.configPath}`);

            // Trigger nginx reload automatically
            this.triggerNginxReload();
        } catch (error) {
            logger.error(`[Proxy Config] Failed to write config file: ${error.message}`);
        }
    }

    // Trigger nginx reload automatically
    async triggerNginxReload() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // Wait a moment for the file to be written
            await new Promise(resolve => setTimeout(resolve, 500));

            // Test nginx configuration first
            await execAsync('docker exec shard-reverse-proxy nginx -t');

            // Reload if configuration is valid
            await execAsync('docker exec shard-reverse-proxy nginx -s reload');
            logger.info('[Proxy Config] Nginx configuration reloaded automatically');
        } catch (error) {
            logger.warn(`[Proxy Config] Failed to reload nginx: ${error.message}`);
        }
    }

    // Load existing mappings from file (for persistence)
    loadMappings() {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                this.mappings.clear(); // Clear existing mappings before reloading

                // Parse backend port mappings
                const backendSection = content.match(/map \$host \$backend_port \{[\s\S]*?\}/);
                if (backendSection) {
                    const backendMatches = backendSection[0].matchAll(/(\S+)\s+(\d+);/g);

                    for (const match of backendMatches) {
                        const [_, subdomain, port] = match;
                        if (subdomain === 'default') continue;

                        const cleanSubdomain = subdomain.replace('.localhost', '').trim();
                        if (cleanSubdomain) {
                            // Try to determine stack based on port range
                            let stack = 'unknown';
                            const portNum = parseInt(port);

                            if (portNum >= 15000 && portNum <= 15999) stack = 'flask';
                            else if (portNum >= 16000 && portNum <= 16999) stack = 'django';
                            else if (portNum >= 17000 && portNum <= 17999) stack = 'mern';

                            this.mappings.set(cleanSubdomain, {
                                stack,
                                port: portNum
                            });
                        }
                    }
                }

                logger.info(`[Proxy Config] Loaded ${this.mappings.size} existing mappings`);
                if (this.mappings.size > 0) {
                    logger.debug('Current mappings:', Array.from(this.mappings.entries()));
                }
            } else {
                logger.info('[Proxy Config] No existing proxy mappings file found, starting fresh');
            }
        } catch (error) {
            logger.error(`[Proxy Config] Failed to load existing config: ${error.message}`, { error });
            // Ensure we have a clean state even if loading fails
            this.mappings.clear();
        }
    }

    // Get all current mappings
    getAllMappings() {
        return Array.from(this.mappings.entries()).map(([subdomain, config]) => ({
            subdomain,
            ...config
        }));
    }
}

module.exports = new ProxyConfig();

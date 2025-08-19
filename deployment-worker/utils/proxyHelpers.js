const reverseProxyManager = require('../services/reverseProxyManager');
const logger = require('./logger');

/**
 * Utility functions for reverse proxy integration
 */

// Update nginx configuration file with current mappings
const updateNginxMappings = async () => {
    try {
        const mappings = reverseProxyManager.getAllMappings();
        
        // Generate nginx map configuration
        const mapConfig = generateNginxMapConfig(mappings);
        
        // Write to proxy mappings file
        const fs = require('fs-extra');
        const path = require('path');
        const configPath = path.join(__dirname, '..', 'nginx', 'proxy-mappings.conf');
        
        await fs.writeFile(configPath, mapConfig, 'utf8');
        logger.info('[Proxy Helpers] Updated nginx mappings configuration');
        
        // Reload nginx if running
        await reverseProxyManager.reloadNginxConfig();
        
        return true;
    } catch (error) {
        logger.error(`[Proxy Helpers] Failed to update nginx mappings: ${error.message}`);
        return false;
    }
};

// Generate nginx map configuration from current mappings
const generateNginxMapConfig = (mappings) => {
    const lines = [];
    
    lines.push('# Auto-generated proxy mappings');
    lines.push('# Updated: ' + new Date().toISOString());
    lines.push('');
    
    // Backend port mapping
    lines.push('map $host $backend_port {');
    lines.push('    default 0;');
    
    mappings.forEach(mapping => {
        lines.push(`    ${mapping.subdomain}.localhost ${mapping.port};`);
    });
    
    lines.push('}');
    lines.push('');
    
    // Frontend port mapping (for MERN)
    lines.push('map $host $frontend_port {');
    lines.push('    default 0;');
    
    mappings.forEach(mapping => {
        if (mapping.stack === 'mern' && mapping.frontendPort) {
            lines.push(`    ${mapping.subdomain}.localhost ${mapping.frontendPort};`);
        }
    });
    
    lines.push('}');
    lines.push('');
    
    return lines.join('\n');
};

// Validate proxy configuration
const validateProxyConfig = async () => {
    try {
        // Check if reverse proxy is running
        const isRunning = await reverseProxyManager.isReverseProxyRunning();
        if (!isRunning) {
            logger.warn('[Proxy Helpers] Reverse proxy is not running');
            return false;
        }
        
        // Test nginx configuration
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync(`docker exec ${reverseProxyManager.nginxContainerName} nginx -t`);
        logger.info('[Proxy Helpers] Nginx configuration is valid');
        
        return true;
    } catch (error) {
        logger.error(`[Proxy Helpers] Proxy configuration validation failed: ${error.message}`);
        return false;
    }
};

// Get deployment URL for a subdomain
const getDeploymentUrl = (subdomain, stack) => {
    return reverseProxyManager.getPublicUrl(subdomain, stack);
};

// Check if subdomain is already in use
const isSubdomainInUse = (subdomain) => {
    const mappings = reverseProxyManager.getAllMappings();
    return mappings.some(mapping => mapping.subdomain === subdomain);
};

module.exports = {
    updateNginxMappings,
    generateNginxMapConfig,
    validateProxyConfig,
    getDeploymentUrl,
    isSubdomainInUse
};

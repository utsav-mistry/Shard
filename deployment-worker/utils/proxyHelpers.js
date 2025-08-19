/**
 * @fileoverview Proxy Helper Utilities
 * @description Provides utility functions for managing reverse proxy configurations and operations
 * @module utils/proxyHelpers
 * @requires services/reverseProxyManager
 * @requires ./logger
 * @author Utsav Mistry
 * @version 0.2.3
 * 
 */

const reverseProxyManager = require('../services/reverseProxyManager');
const logger = require('./logger');

/**
 * Updates the Nginx configuration file with current proxy mappings
 * @async
 * @function updateNginxMappings
 * @returns {Promise<boolean>} True if update was successful, false otherwise
 * @description Generates and writes the Nginx map configuration based on current proxy mappings
 * and triggers a configuration reload if successful.
 * @example
 * const success = await updateNginxMappings();
 * if (success) {
 *   console.log('Nginx mappings updated successfully');
 * }
 */
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

/**
 * Generates Nginx map configuration from proxy mappings
 * @function generateNginxMapConfig
 * @param {Array<Object>} mappings - Array of proxy mapping objects
 * @param {string} mappings[].subdomain - Subdomain for the mapping
 * @param {number} mappings[].port - Backend port number
 * @param {string} [mappings[].stack] - Application stack type (e.g., 'mern', 'django')
 * @param {number} [mappings[].frontendPort] - Frontend port for MERN stack
 * @returns {string} Generated Nginx map configuration
 * @description Creates Nginx map blocks for backend and frontend port mappings
 * based on the provided proxy mappings.
 */
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

/**
 * Validates the Nginx proxy configuration
 * @async
 * @function validateProxyConfig
 * @returns {Promise<boolean>} True if configuration is valid, false otherwise
 * @description Checks if the reverse proxy is running and validates the Nginx
 * configuration by executing 'nginx -t' in the proxy container.
 * @example
 * const isValid = await validateProxyConfig();
 * if (isValid) {
 *   console.log('Proxy configuration is valid');
 * }
 */
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

/**
 * Gets the public URL for a deployment
 * @function getDeploymentUrl
 * @param {string} subdomain - The subdomain for the deployment
 * @param {string} stack - The application stack (e.g., 'mern', 'django', 'flask')
 * @returns {string} The complete public URL for the deployment
 * @description Constructs the public URL using the reverse proxy manager's URL generation
 * @example
 * const url = getDeploymentUrl('myapp', 'mern');
 * // Returns: 'http://myapp.localhost'
 */
const getDeploymentUrl = (subdomain, stack) => {
    return reverseProxyManager.getPublicUrl(subdomain, stack);
};

/**
 * Checks if a subdomain is already in use by an existing proxy mapping
 * @function isSubdomainInUse
 * @param {string} subdomain - The subdomain to check
 * @returns {boolean} True if the subdomain is already in use, false otherwise
 * @description Verifies if the provided subdomain is already registered in the proxy mappings
 * @example
 * if (isSubdomainInUse('myapp')) {
 *   console.log('Subdomain is already in use');
 * }
 */
const isSubdomainInUse = (subdomain) => {
    const mappings = reverseProxyManager.getAllMappings();
    return mappings.some(mapping => mapping.subdomain === subdomain);
};

/**
 * @namespace proxyHelpers
 * @description Collection of utilities for managing reverse proxy configurations
 */
module.exports = {
    updateNginxMappings,
    generateNginxMapConfig,
    validateProxyConfig,
    getDeploymentUrl,
    isSubdomainInUse
};

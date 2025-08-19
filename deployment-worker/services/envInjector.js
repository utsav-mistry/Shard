/**
 * @fileoverview Environment Variable Injection Service
 * @description Service for injecting environment variables into deployment projects
 * @author Utsav Mistry
 * @version 0.2.3
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Inject environment variables into project as .env file
 * @async
 * @function injectEnv
 * @param {string} projectPath - Absolute path to the project directory
 * @param {Array<Object>} envVars - Array of environment variable objects
 * @param {string} envVars[].key - Environment variable name
 * @param {string|number|boolean} envVars[].value - Environment variable value
 * @param {string} projectId - Unique project identifier for logging
 * @returns {Promise<Object>} Injection result object
 * @returns {boolean} returns.success - Whether injection was successful
 * @returns {string|null} returns.path - Path to created .env file or null if skipped
 * @returns {number} returns.variablesCount - Number of variables injected
 * @returns {Array<string>} [returns.variables] - Array of variable names injected
 * @returns {boolean} [returns.skipped] - Whether injection was skipped
 * @throws {Error} File system or validation errors
 * @description Creates .env file with properly escaped environment variables for Docker compatibility.
 * Handles special characters, spaces, and quotes in values. Skips invalid or empty variables.
 * @example
 * const result = await injectEnv('/path/to/project', [
 *   { key: 'API_KEY', value: 'secret123' },
 *   { key: 'DEBUG', value: true }
 * ], 'proj123');
 * console.log(`Injected ${result.variablesCount} variables`);
 */
const injectEnv = async (projectPath, envVars, projectId) => {
    const envFilePath = path.join(projectPath, ".env");

    try {
        // Handle null, undefined, or non-array envVars
        if (!envVars || !Array.isArray(envVars)) {
            logger.info(`[Project ${projectId}] No environment variables provided - skipping .env creation`);
            return {
                success: true,
                path: null,
                variablesCount: 0,
                skipped: true
            };
        }

        // Filter out invalid entries and prepare .env content
        const validEnvVars = envVars.filter(env =>
            env &&
            env.key &&
            typeof env.key === 'string' &&
            env.key.trim() !== '' &&
            env.value !== undefined &&
            env.value !== null
        );

        if (validEnvVars.length === 0) {
            logger.info(`[Project ${projectId}] No valid environment variables to inject - skipping .env creation`);
            return {
                success: true,
                path: null,
                variablesCount: 0,
                skipped: true
            };
        }

        // Prepare .env content with proper escaping for Docker compatibility
        const envContent = validEnvVars
            .map(env => {
                const key = env.key.trim();
                let value = String(env.value);
                
                // Only add quotes if the value contains spaces or special characters
                if (value.includes(' ') || value.includes('\n') || value.includes('"') || value.includes('$')) {
                    value = value
                        .replace(/\n/g, "\\n")
                        .replace(/"/g, '\\"')
                        .replace(/\$/g, '\\$');
                    return `${key}="${value}"`;
                } else {
                    return `${key}=${value}`;
                }
            })
            .join("\n");

        // Write .env file for Docker --env-file
        fs.writeFileSync(envFilePath, envContent, { encoding: "utf-8" });

        logger.info(`[Project ${projectId}] Environment variables injected: ${validEnvVars.length} variables`);
        logger.info(`[Project ${projectId}] Environment file created at: ${envFilePath}`);
        logger.info(`[Project ${projectId}] Variables: ${validEnvVars.map(env => env.key).join(', ')}`);

        return {
            success: true,
            path: envFilePath,
            variablesCount: validEnvVars.length,
            variables: validEnvVars.map(env => env.key)
        };
    } catch (error) {
        logger.error(`[Project ${projectId}] Environment injection failed:`, error.message);
        throw new Error(`Failed to inject environment for project ${projectId}: ${error.message}`);
    }
};

/**
 * Export environment injection functions
 * @module envInjector
 * @description Service for managing environment variables in deployment projects
 */
module.exports = { injectEnv, fetchEnvVars };

/**
 * Fetch environment variables for a project from backend API
 * @async
 * @function fetchEnvVars
 * @param {string} projectId - Unique project identifier
 * @param {string} token - JWT authentication token
 * @param {string} [logPath] - Optional path to log file for error logging
 * @returns {Promise<Array<Object>>} Array of environment variable objects
 * @returns {string} returns[].key - Environment variable name
 * @returns {string|number|boolean} returns[].value - Environment variable value
 * @throws {Error} Network or authentication errors (caught internally)
 * @description Fetches environment variables from backend API with proper error handling.
 * Returns empty array if no variables found or on error. Logs detailed information for debugging.
 * @example
 * const envVars = await fetchEnvVars('proj123', 'jwt_token', '/path/to/log');
 * if (envVars.length > 0) {
 *   await injectEnv(projectPath, envVars, projectId);
 * }
 */
async function fetchEnvVars(projectId, token, logPath) {
    try {
                const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const url = `${backendUrl}/api/projects/${projectId}/env`;
        
        logger.info(`[Project ${projectId}] Fetching environment variables from: ${url}`);
        
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000 // Increased timeout to 30 seconds
        });

        logger.info(`[Project ${projectId}] Environment variables response:`, {
            status: response.status,
            hasData: !!response.data,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
            hasSuccess: response.data?.success,
            dataLength: response.data?.data?.length || (Array.isArray(response.data) ? response.data.length : 0)
        });

        if (response.data && response.data.success) {
            const envVars = response.data.data || [];
            logger.info(`[Project ${projectId}] Successfully fetched ${envVars.length} environment variables`);
            return envVars;
        } else if (response.data && Array.isArray(response.data)) {
            logger.info(`[Project ${projectId}] Successfully fetched ${response.data.length} environment variables (direct array)`);
            return response.data;
        } else {
            logger.warn(`[Project ${projectId}] No environment variables found in response`);
            return [];
        }
    } catch (err) {
        if (err.response?.status === 404) {
            logger.info(`No environment variables found for project ${projectId}`);
            return [];
        }

        const errorDetails = {
            status: err.response?.status,
            message: err.response?.data?.message || err.message,
            timestamp: new Date().toISOString()
        };
        try {
            if (logPath) {
                fs.appendFileSync(logPath, `ENV_FETCH_WARNING: ${JSON.stringify(errorDetails)}\n`);
            }
        } catch (_) {
            // ignore file write errors
        }
        logger.warn(`Environment fetch failed for project ${projectId}: ${errorDetails.message}`);
        return [];
    }
}

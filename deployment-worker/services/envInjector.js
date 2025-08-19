const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

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

module.exports = { injectEnv, fetchEnvVars };

// Fetch environment variables for a project from backend API
// Keeps env fetching logic centralized with env injection utilities
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

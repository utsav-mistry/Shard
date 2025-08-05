const fs = require("fs");
const path = require("path");

const injectEnv = async (projectPath, envVars, projectId) => {
    const envFilePath = path.join(projectPath, ".env");

    try {
        // Validate input
        if (!Array.isArray(envVars)) {
            throw new Error("Environment variables should be an array of { key, value }");
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
            console.log(`[Project ${projectId}] No valid environment variables to inject for this project`);
            return {
                success: true,
                path: envFilePath,
                variablesCount: 0
            };
        }

        // Prepare .env content with proper escaping for Docker compatibility
        const envContent = validEnvVars
            .map(env => {
                const key = env.key.trim();
                const value = String(env.value)
                    .replace(/\n/g, "\\n")
                    .replace(/"/g, '\\"')
                    .replace(/\$/g, '\\$');
                return `${key}="${value}"`;
            })
            .join("\n");

        // Write .env file for Docker --env-file
        fs.writeFileSync(envFilePath, envContent, { encoding: "utf-8" });

        console.log(`[Project ${projectId}] Environment variables injected: ${validEnvVars.length} variables`);
        console.log(`[Project ${projectId}] Environment file created at: ${envFilePath}`);
        console.log(`[Project ${projectId}] Variables: ${validEnvVars.map(env => env.key).join(', ')}`);

        return {
            success: true,
            path: envFilePath,
            variablesCount: validEnvVars.length,
            variables: validEnvVars.map(env => env.key)
        };
    } catch (error) {
        console.error(`[Project ${projectId}] Environment injection failed:`, error.message);
        throw new Error(`Failed to inject environment for project ${projectId}: ${error.message}`);
    }
};

module.exports = { injectEnv };

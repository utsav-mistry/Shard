const envService = require("../services/envService");
const Project = require("../models/Project");

// Create environment variable
const addEnvVar = async (req, res) => {
    const { key, value } = req.body;
    const { projectId } = req.params;

    // Input validation
    if (!key || !value) {
        return res.apiValidationError(
            {
                key: !key ? 'Environment variable key is required' : null,
                value: !value ? 'Environment variable value is required' : null
            },
            'Missing required fields'
        );
    }

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        const envVar = await envService.addEnvVar(projectId, key.toUpperCase(), value);
        return res.apiCreated({
            _id: envVar._id,
            key: envVar.key,
            value: value, // Return the decrypted value
            createdAt: envVar.createdAt
        }, 'Environment variable created successfully');
    } catch (err) {
        console.error("Failed to add env var:", err);
        if (err.message.includes('already exists')) {
            return res.apiValidationError(
                { key: err.message },
                'Environment variable creation failed'
            );
        }
        return res.apiServerError('Failed to create environment variable', err.message);
    }
};

// Get all environment variables for project
const getEnvVars = async (req, res) => {
    const { projectId } = req.params;

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        const envVars = await envService.getEnvVars(projectId);
        return res.apiSuccess(envVars, 'Environment variables retrieved successfully');
    } catch (err) {
        console.error("Failed to fetch env vars:", err);
        return res.apiServerError('Failed to retrieve environment variables', err.message);
    }
};

// Update environment variable
const updateEnvVar = async (req, res) => {
    const { key, value, secret } = req.body;
    const { id, projectId } = req.params;

    // Input validation
    if (!key || !value) {
        return res.apiValidationError(
            {
                key: !key ? 'Environment variable key is required' : null,
                value: !value ? 'Environment variable value is required' : null
            },
            'Missing required fields'
        );
    }

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        // Get the env var to verify it belongs to this project
        const existingEnvVar = await envService.getEnvVarById(id);
        if (!existingEnvVar) {
            return res.apiNotFound('Environment variable');
        }

        if (existingEnvVar.projectId.toString() !== projectId) {
            return res.apiForbidden('Environment variable does not belong to this project');
        }

        const updatedEnvVar = await envService.updateEnvVar(id, key.toUpperCase(), value, secret);
        return res.apiSuccess({
            _id: updatedEnvVar._id,
            key: updatedEnvVar.key,
            value: value, // Return the decrypted value
            secret: updatedEnvVar.secret,
            updatedAt: updatedEnvVar.updatedAt
        }, 'Environment variable updated successfully');
    } catch (err) {
        console.error("Failed to update env var:", err);
        if (err.message.includes('already exists')) {
            return res.apiValidationError(
                { key: err.message },
                'Environment variable update failed'
            );
        }
        return res.apiServerError('Failed to update environment variable', err.message);
    }
};

// Delete environment variable
const deleteEnvVar = async (req, res) => {
    const { id, projectId } = req.params;

    if (!id) {
        return res.apiValidationError({ id: 'Environment variable ID is required' }, 'Environment variable ID is required');
    }
    
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: 'Invalid project ID format'
        });
    }

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        // Get the env var to verify it belongs to this project
        const envVar = await envService.getEnvVarById(id);
        if (!envVar) {
            return res.apiNotFound('Environment variable');
        }

        if (envVar.projectId.toString() !== projectId) {
            return res.apiForbidden('Environment variable does not belong to this project');
        }

        await envService.deleteEnvVar(id);
        return res.apiSuccess(null, 'Environment variable deleted successfully');
    } catch (err) {
        console.error("Failed to delete env var:", err);
        return res.apiServerError('Failed to delete environment variable', err.message);
    }
};

// Get a single environment variable by ID
const getEnvVarById = async (req, res) => {
    const { id, projectId } = req.params;

    if (!id) {
        return res.apiValidationError({ id: 'Environment variable ID is required' }, 'Environment variable ID is required');
    }

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        const envVar = await envService.getEnvVarById(id);
        if (!envVar) {
            return res.apiNotFound('Environment variable');
        }

        if (envVar.projectId.toString() !== projectId) {
            return res.apiForbidden('Environment variable does not belong to this project');
        }

        return res.apiSuccess(envVar, 'Environment variable retrieved successfully');
    } catch (err) {
        console.error("Failed to fetch env var by ID:", err);
        return res.apiServerError('Failed to retrieve environment variable', err.message);
    }
};

// Bulk create environment variables (for project creation)
const addBulkEnvVars = async (req, res) => {
    const { envVars } = req.body;
    const { projectId } = req.params;

    // Input validation
    if (!envVars || !Array.isArray(envVars)) {
        return res.apiValidationError(
            { envVars: 'Environment variables must be an array' },
            'Invalid environment variables format'
        );
    }

    // Filter out empty env vars and validate
    const validEnvVars = envVars.filter(env => env.key && env.key.trim() !== '');
    
    if (validEnvVars.length === 0) {
        return res.apiSuccess([], 'No environment variables to create');
    }

    // Validate each env var
    for (const env of validEnvVars) {
        if (!env.value || env.value.trim() === '') {
            return res.apiValidationError(
                { [`${env.key}`]: 'Environment variable value is required' },
                'Missing required fields'
            );
        }
    }

    try {
        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        const createdEnvVars = [];
        const errors = [];

        // Create each environment variable
        for (const env of validEnvVars) {
            try {
                const envVar = await envService.addEnvVar(
                    projectId, 
                    env.key.toUpperCase().trim(), 
                    env.value.trim(),
                    env.secret || false
                );
                createdEnvVars.push({
                    _id: envVar._id,
                    key: envVar.key,
                    value: env.value.trim(),
                    secret: envVar.secret,
                    createdAt: envVar.createdAt
                });
            } catch (err) {
                console.error(`Failed to add env var ${env.key}:`, err);
                if (err.message.includes('already exists')) {
                    errors.push({ key: env.key, error: err.message });
                } else {
                    errors.push({ key: env.key, error: 'Failed to create environment variable' });
                }
            }
        }

        if (errors.length > 0 && createdEnvVars.length === 0) {
            return res.apiValidationError(
                { envVars: errors },
                'Failed to create environment variables'
            );
        }

        return res.apiCreated({
            created: createdEnvVars,
            errors: errors
        }, `Successfully created ${createdEnvVars.length} environment variable(s)`);
    } catch (err) {
        console.error("Failed to add bulk env vars:", err);
        return res.apiServerError('Failed to create environment variables', err.message);
    }
};

module.exports = {
    addEnvVar,
    addBulkEnvVars,
    getEnvVars,
    getEnvVarById,
    updateEnvVar,
    deleteEnvVar
};

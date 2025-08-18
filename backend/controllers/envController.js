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

module.exports = {
    addEnvVar,
    getEnvVars,
    getEnvVarById,
    updateEnvVar,
    deleteEnvVar
};

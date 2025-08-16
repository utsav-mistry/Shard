const envService = require("../services/envService");
const Project = require("../models/Project");

// Create environment variable
const addEnvVar = async (req, res) => {
    const { projectId, key, value } = req.body;

    // Input validation
    if (!projectId || !key || !value) {
        return res.apiValidationError(
            {
                projectId: !projectId ? 'Project ID is required' : null,
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

        const envVar = await envService.addEnvVar(projectId, key, value);
        return res.apiCreated(envVar, 'Environment variable created successfully');
    } catch (err) {
        console.error("Failed to add env var:", err);
        return res.apiServerError('Failed to create environment variable', err.message);
    }
};

// Get all environment variables for project
const getEnvVars = async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        return res.apiValidationError({ projectId: 'Project ID is required' }, 'Project ID is required');
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

        const decryptedVars = await envService.getEnvVars(projectId);
        return res.apiSuccess(decryptedVars, 'Environment variables retrieved successfully');
    } catch (err) {
        console.error("Failed to fetch env vars:", err);
        return res.apiServerError('Failed to retrieve environment variables', err.message);
    }
};

// Delete environment variable
const deleteEnvVar = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.apiValidationError({ id: 'Environment variable ID is required' }, 'Environment variable ID is required');
    }

    try {
        // Get the env var first to check project ownership
        const envVar = await envService.getEnvVarById(id);
        if (!envVar) {
            return res.apiNotFound('Environment variable');
        }

        // Check if user has access to this project
        const query = req.user.role === 'admin'
            ? { _id: envVar.projectId }
            : { _id: envVar.projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiForbidden('You do not have permission to delete this environment variable');
        }

        await envService.deleteEnvVar(id);
        return res.apiSuccess(null, 'Environment variable deleted successfully');
    } catch (err) {
        console.error("Failed to delete env var:", err);
        return res.apiServerError('Failed to delete environment variable', err.message);
    }
};

module.exports = { addEnvVar, getEnvVars, deleteEnvVar };

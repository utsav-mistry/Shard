/**
 * @fileoverview Environment Variable Controller
 * @description Handles CRUD operations for project environment variables with encryption,
 *              validation, and access control for the Shard platform
 *  @author Utsav Mistry
 * @version 1.0.0
 */

const envService = require("../services/envService");
const Project = require("../models/Project");

/**
 * Create a new environment variable for a project
 * @async
 * @function addEnvVar
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.key - Environment variable key (will be converted to UPPER_SNAKE_CASE)
 * @param {string} req.body.value - Environment variable value (will be encrypted)
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.projectId - Project ID to add environment variable to
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created environment variable
 * @throws {ValidationError} When key or value is missing
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ConflictError} When environment variable key already exists
 * @throws {ServerError} When database operations fail
 * @note Admin users can add environment variables to any project, regular users only their own
 */
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

/**
 * Get all environment variables for a project
 * @async
 * @function getEnvVars
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.projectId - Project ID to get environment variables for
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with environment variables array
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ServerError} When database operations fail
 * @note Returns decrypted values for authorized users
 * @note Admin users can access any project's environment variables, regular users only their own
 */
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

/**
 * Update an existing environment variable
 * @async
 * @function updateEnvVar
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.key - Updated environment variable key
 * @param {string} req.body.value - Updated environment variable value
 * @param {boolean} [req.body.secret] - Whether the variable is secret
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Environment variable ID to update
 * @param {string} req.params.projectId - Project ID the environment variable belongs to
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated environment variable
 * @throws {ValidationError} When key or value is missing
 * @throws {NotFoundError} When project or environment variable is not found
 * @throws {ForbiddenError} When environment variable doesn't belong to the project
 * @throws {ConflictError} When updated key already exists
 * @throws {ServerError} When database operations fail
 * @note Admin users can update any environment variable, regular users only their own
 */
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

/**
 * Delete an environment variable
 * @async
 * @function deleteEnvVar
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Environment variable ID to delete
 * @param {string} req.params.projectId - Project ID the environment variable belongs to
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 * @throws {ValidationError} When ID is missing or invalid format
 * @throws {NotFoundError} When project or environment variable is not found
 * @throws {ForbiddenError} When environment variable doesn't belong to the project
 * @throws {ServerError} When database operations fail
 * @note Admin users can delete any environment variable, regular users only their own
 */
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

/**
 * Get a single environment variable by ID
 * @async
 * @function getEnvVarById
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Environment variable ID to retrieve
 * @param {string} req.params.projectId - Project ID the environment variable belongs to
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with environment variable data
 * @throws {ValidationError} When ID is missing
 * @throws {NotFoundError} When project or environment variable is not found
 * @throws {ForbiddenError} When environment variable doesn't belong to the project
 * @throws {ServerError} When database operations fail
 * @note Returns decrypted value for authorized users
 * @note Admin users can access any environment variable, regular users only their own
 */
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

/**
 * Bulk create environment variables (used during project creation)
 * @async
 * @function addBulkEnvVars
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array<Object>} req.body.envVars - Array of environment variables to create
 * @param {string} req.body.envVars[].key - Environment variable key
 * @param {string} req.body.envVars[].value - Environment variable value
 * @param {boolean} [req.body.envVars[].secret=false] - Whether the variable is secret
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.projectId - Project ID to add environment variables to
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created environment variables and any errors
 * @throws {ValidationError} When envVars is not an array or contains invalid data
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ServerError} When database operations fail
 * @note Continues processing even if some variables fail, returns partial success with errors
 * @note Filters out empty keys and validates all entries before processing
 * @note Admin users can bulk create for any project, regular users only their own
 */
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

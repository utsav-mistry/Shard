/**
 * @fileoverview Project Controller
 * @description Handles CRUD operations for projects, including creation with environment variables,
 *              automatic deployment triggering, and resource cleanup
 *  @author Utsav Mistry
 * @version 1.0.0
 */

const path = require('path');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const EnvVar = require('../models/EnvVar');
const { encrypt } = require('../utils/encryptor');
const { generateSubdomain } = require("../services/subdomainService");
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProject:
 *       type: object
 *       required:
 *         - name
 *         - repoUrl
 *         - framework
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: "My Awesome Project"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "A brief description of my project"
 *         repoUrl:
 *           type: string
 *           format: uri
 *           example: "https://github.com/username/repo"
 *         branch:
 *           type: string
 *           default: "main"
 *           example: "main"
 *         framework:
 *           type: string
 *           enum: [mern, flask, django]
 *           example: "mern"
 *     Project:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateProject'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               format: objectid
 *               example: "507f1f77bcf86cd799439011"
 *             ownerId:
 *               type: string
 *               format: objectid
 *               example: "507f1f77bcf86cd799439012"
 *             subdomain:
 *               type: string
 *               example: "my-awesome-project"
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     projectIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: objectid
 *       description: Project ID
 */

/**
 * Create a new project with optional environment variables and trigger initial deployment
 * @async
 * @function createProject
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Project name (3-50 characters)
 * @param {string} req.body.repoUrl - Repository URL
 * @param {string} req.body.framework - Framework type (mern, flask, django)
 * @param {string} [req.body.branch='main'] - Git branch to deploy
 * @param {string} [req.body.description] - Project description
 * @param {Array<Object>} [req.body.environmentVariables] - Environment variables array
 * @param {string} req.body.environmentVariables[].key - Environment variable key (UPPER_SNAKE_CASE)
 * @param {string} req.body.environmentVariables[].value - Environment variable value
 * @param {boolean} [req.body.environmentVariables[].secret=false] - Whether variable is secret
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created project and initial deployment info
 * @throws {ValidationError} When required fields missing or validation fails
 * @throws {ServerError} When database operations or deployment triggering fails
 */
const createProject = async (req, res) => {
    const { name, repoUrl, framework, branch = 'main', description, environmentVariables = [] } = req.body;
    const ownerId = req.user._id;

    const logContext = {
        userId: req.user._id,
        projectName: name,
        framework,
        branch
    };

    try {
        logger.info('Creating new project', logContext);

        // Validate input
        if (!name || !repoUrl || !framework) {
            logger.error('Missing required fields', {
                ...logContext,
                error: 'Missing required fields',
                details: {
                    name: !name ? 'Project name is required' : undefined,
                    repoUrl: !repoUrl ? 'Repository URL is required' : undefined,
                    framework: !framework ? 'Framework is required' : undefined
                }
            });

            return res.apiValidationError(
                {
                    name: !name ? 'Project name is required' : undefined,
                    repoUrl: !repoUrl ? 'Repository URL is required' : undefined,
                    framework: !framework ? 'Framework is required' : undefined
                },
                'Missing required fields'
            );
        }

        // Validate environment variables BEFORE creating project
        const envVarErrors = [];
        const envKeys = new Set();
        const envObjectForJob = {};

        if (environmentVariables && Array.isArray(environmentVariables) && environmentVariables.length > 0) {
            environmentVariables.forEach((env, index) => {
                const errors = [];

                // Validate key
                if (!env.key || !env.key.trim()) {
                    errors.push('Environment variable key is required');
                } else {
                    const key = env.key.trim().toUpperCase();

                    // Check key format (UPPER_SNAKE_CASE)
                    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
                        errors.push('Key must be in UPPER_SNAKE_CASE format (e.g., API_KEY)');
                    }

                    // Check for duplicates
                    if (envKeys.has(key)) {
                        errors.push('Duplicate environment variable key');
                    } else {
                        envKeys.add(key);
                    }
                }

                // Validate value
                if (!env.value || !env.value.trim()) {
                    errors.push('Environment variable value is required');
                }

                if (errors.length > 0) {
                    envVarErrors.push({ index, errors });
                }
            });
        }

        // Return validation errors if any
        if (envVarErrors.length > 0) {
            logger.error('Environment variable validation failed', {
                ...logContext,
                envVarErrors
            });

            return res.apiValidationError(
                { environmentVariables: envVarErrors },
                'Environment variable validation failed'
            );
        }

        // Generate unique subdomain
        const subdomain = generateSubdomain(name);
        logContext.subdomain = subdomain;

        // Create new project document
        const project = await Project.create({
            ownerId,
            name,
            description,
            repoUrl,
            framework,
            branch,
            subdomain,
            status: 'active',
        });

        // Save environment variables (validation already passed)
        if (environmentVariables && Array.isArray(environmentVariables) && environmentVariables.length > 0) {
            try {
                const envPromises = environmentVariables.map(async (env) => {
                    if (env.key && env.value) {
                        const key = env.key.trim().toUpperCase();
                        const encryptedValue = encrypt(env.value);
                        await EnvVar.create({
                            projectId: project._id,
                            key,
                            value: encryptedValue,
                            secret: env.secret || false
                        });
                        envObjectForJob[key] = env.value; // Use unencrypted for job
                    }
                });
                await Promise.all(envPromises);
            } catch (envError) {
                // Rollback: Delete the created project if env var creation fails
                logger.error('Environment variable creation failed, rolling back project', {
                    ...logContext,
                    projectId: project._id,
                    error: envError.message
                });

                try {
                    await Project.findByIdAndDelete(project._id);
                    logger.info('Project rollback completed', { projectId: project._id });
                } catch (rollbackError) {
                    logger.error('Project rollback failed', {
                        projectId: project._id,
                        error: rollbackError.message
                    });
                }

                return res.apiServerError('Failed to create environment variables', envError.message);
            }
        }

        logger.info('Project created successfully', {
            ...logContext,
            projectId: project._id
        });

        // Auto-create first deployment (Vercel-like flow)
        try {
            const axios = require('axios');
            const logService = require('../services/logService');

            // Create initial deployment record
            const Deployment = require('../models/Deployment');
            const deployment = await Deployment.create({
                projectId: project._id,
                status: "pending",
                branch: branch,
                commitHash: 'latest',
                commitMessage: `Initial deployment of ${name}`,
                userEmail: req.user.email,
                createdAt: new Date()
            });

            // Prepare job for deployment worker
            const enableAiReview = !(project.settings?.aiOptOut || project.aiOptOut);
            console.log(`[DEBUG] AI Review Settings - project.aiOptOut: ${project.aiOptOut}, project.settings?.aiOptOut: ${project.settings?.aiOptOut}, enableAiReview: ${enableAiReview}`);
            
            const job = {
                projectId: project._id,
                deploymentId: deployment._id,
                repoUrl: project.repoUrl,
                stack: project.framework,
                subdomain: project.subdomain,
                branch: branch,
                commitHash: 'latest',
                envVars: envObjectForJob, // Pass saved env vars
                userEmail: req.user.email,
                token: req.headers.authorization?.replace('Bearer ', ''),
                isInitialDeployment: true,
                enableAiReview: enableAiReview, // Pass AI review setting
                aiModel: 'deepseek_lite' // Default AI model
            };

            // Log deployment start
            await logService.addLog(project._id, deployment._id, "build", "Initial deployment started");

            // AI review will be handled by deployment worker
            let shouldDeploy = true;
            let deploymentReason = "Initial deployment queued for processing";

            // Queue deployment job only once if needed
            if (shouldDeploy) {
                await logService.addLog(project._id, deployment._id, "ai-review", deploymentReason);

                await axios.post(`${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`, job, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });

                await logService.addLog(project._id, deployment._id, "queue", "Initial deployment job queued");
            }

            logger.info('Initial deployment triggered successfully', {
                ...logContext,
                projectId: project._id,
                deploymentId: deployment._id
            });

            // Return project with deployment info
            return res.apiCreated({
                ...project.toObject(),
                initialDeployment: {
                    _id: deployment._id,
                    status: deployment.status
                }
            }, 'Project created and initial deployment started');

        } catch (deployError) {
            logger.error('Failed to trigger initial deployment', {
                ...logContext,
                projectId: project._id,
                error: deployError.message
            });

            // Still return success for project creation, but note deployment failure
            return res.apiCreated({
                ...project.toObject(),
                deploymentError: 'Initial deployment failed to start'
            }, 'Project created successfully, but initial deployment failed');
        }
    } catch (err) {
        logger.error('Failed to create project', {
            ...logContext,
            error: err.message,
            stack: err.stack
        });

        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const fieldName = field === 'subdomain' ? 'Project name' : field;
            return res.apiValidationError(
                { [field]: `${fieldName} already exists` },
                `${fieldName} already exists`
            );
        }

        return res.apiServerError('Failed to create project', err.message);
    }
};

/**
 * Get paginated list of projects for the authenticated user
 * @async
 * @function getProjects
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of items per page
 * @param {string} [req.query.sort='createdAt:desc'] - Sort field and order
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with paginated projects list
 * @throws {ValidationError} When pagination parameters are invalid
 * @throws {ServerError} When database operations fail
 * @note Admin users can see all projects, regular users only see their own
 */
const getProjects = async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt:desc' } = req.query;
    const skip = (page - 1) * limit;

    const logContext = {
        userId: req.user._id,
        page,
        limit,
        sort
    };

    try {
        logger.debug('Fetching projects', logContext);

        const [sortField, sortOrder] = sort.split(':');
        const sortOptions = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

        // Validate user ID
        if (!req.user || !req.user._id) {
            logger.error('Invalid user in request', { userId: req.user?._id });
            return res.apiError('User information is missing or invalid', 400);
        }

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            logger.error('Invalid pagination parameters', { page, limit });
            return res.apiValidationError(
                { page: 'Page must be a positive number', limit: 'Limit must be a positive number' },
                'Invalid pagination parameters'
            );
        }

        // Build query - admin can see all projects, users only see their own
        const query = req.user.role === 'admin' ? {} : { ownerId: req.user._id };

        // Build query with error handling
        let projects, total;
        try {
            [projects, total] = await Promise.all([
                Project.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNum)
                    .populate('ownerId', 'name email'),
                Project.countDocuments(query)
            ]);
        } catch (dbError) {
            logger.error('Database error when fetching projects', {
                error: dbError.message,
                stack: dbError.stack,
                userId: req.user._id
            });

            return res.apiServerError('Failed to fetch projects from database', dbError.message);
        }

        logger.info(`Fetched ${projects.length} projects`, {
            ...logContext,
            total,
            count: projects.length,
            isAdmin: req.user.role === 'admin'
        });

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
        };

        return res.apiPaginated(projects, pagination, 'Projects fetched successfully');
    } catch (err) {
        logger.error('Failed to fetch projects', {
            ...logContext,
            error: err.message,
            stack: err.stack
        });

        return res.apiServerError('Failed to fetch projects', err.message);
    }
};

/**
 * Get a specific project by ID
 * @async
 * @function getProjectById
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Project ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with project data
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ServerError} When database operations fail
 * @note Admin users can access any project, regular users only their own
 */
const getProjectById = async (req, res) => {
    const { id } = req.params;

    const logContext = {
        userId: req.user._id,
        projectId: id
    };

    try {
        logger.debug('Fetching project', logContext);

        // Admin can access any project, users only their own
        const query = req.user.role === 'admin'
            ? { _id: id }
            : { _id: id, ownerId: req.user._id };

        const project = await Project.findOne(query).populate('ownerId', 'name email');

        if (!project) {
            logger.warn('Project not found', logContext);
            return res.apiNotFound('Project');
        }

        logger.info('Project fetched successfully', logContext);
        return res.apiSuccess(project, 'Project fetched successfully');
    } catch (err) {
        logger.error('Failed to fetch project', {
            ...logContext,
            error: err.message,
            stack: err.stack
        });

        return res.apiServerError('Failed to fetch project', err.message);
    }
};

/**
 * Update an existing project
 * @async
 * @function updateProject
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Project ID
 * @param {Object} req.body - Request body with update data
 * @param {string} [req.body.name] - Updated project name
 * @param {string} [req.body.description] - Updated project description
 * @param {string} [req.body.repoUrl] - Updated repository URL
 * @param {string} [req.body.framework] - Updated framework
 * @param {string} [req.body.branch] - Updated branch
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated project data
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ValidationError} When update data is invalid
 * @throws {ServerError} When database operations fail
 * @note Admin users can update any project, regular users only their own
 */
const updateProject = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const logContext = {
        userId: req.user._id,
        projectId: id,
        updates: Object.keys(updateData)
    };

    try {
        logger.info('Updating project', logContext);

        // Admin can update any project, users only their own
        const query = req.user.role === 'admin'
            ? { _id: id }
            : { _id: id, ownerId: req.user._id };

        const project = await Project.findOneAndUpdate(
            query,
            updateData,
            { new: true, runValidators: true }
        ).populate('ownerId', 'name email');

        if (!project) {
            logger.warn('Project not found for update', logContext);
            return res.apiNotFound('Project');
        }

        logger.info('Project updated successfully', logContext);
        return res.apiSuccess(project, 'Project updated successfully');
    } catch (err) {
        logger.error('Failed to update project', {
            ...logContext,
            error: err.message,
            stack: err.stack
        });

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = {};
            Object.keys(err.errors).forEach(key => {
                errors[key] = err.errors[key].message;
            });

            return res.apiValidationError(errors, 'Invalid input data');
        }

        return res.apiServerError('Failed to update project', err.message);
    }
};

/**
 * Delete a project and all associated resources
 * @async
 * @function deleteProject
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Project ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ServerError} When database operations fail
 * @note Performs cascade deletion of:
 *       - Docker containers and images
 *       - Environment variables
 *       - Deployments and their logs
 *       - Project record
 * @note Admin users can delete any project, regular users only their own
 */
const deleteProject = async (req, res) => {
    const { id } = req.params;

    const logContext = {
        userId: req.user._id,
        projectId: id
    };

    try {
        logger.info('Deleting project', logContext);

        // Admin can delete any project, users only their own
        const query = req.user.role === 'admin'
            ? { _id: id }
            : { _id: id, ownerId: req.user._id };

        const project = await Project.findOne(query);

        if (!project) {
            logger.warn('Project not found for deletion', logContext);
            return res.apiNotFound('Project');
        }

        // Cleanup Docker containers and images before deleting project
        try {
            logger.info('Cleaning up Docker resources for project', logContext);
            const axios = require('axios');
            const deploymentWorkerUrl = process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000';

            await axios.delete(`${deploymentWorkerUrl}/api/deploy/cleanup/${id}`, {
                data: { subdomain: project.subdomain },
                timeout: 30000 // 30 second timeout for cleanup
            });

            logger.info('Docker resources cleaned up successfully', logContext);
        } catch (dockerError) {
            // Log the error but don't fail the project deletion
            logger.warn('Failed to cleanup Docker resources, continuing with project deletion', {
                ...logContext,
                dockerError: dockerError.message
            });
        }

        // Cascade delete related records
        logger.info('Starting cascade deletion of related records', logContext);

        // 1. Delete environment variables
        try {
            const EnvVar = require('../models/EnvVar');
            const deletedEnvVars = await EnvVar.deleteMany({ projectId: id });
            logger.info('Environment variables deleted', {
                ...logContext,
                deletedCount: deletedEnvVars.deletedCount
            });
        } catch (envError) {
            logger.warn('Failed to delete environment variables', {
                ...logContext,
                error: envError.message
            });
        }

        // 2. Delete deployments and their logs
        try {
            const Deployment = require('../models/Deployment');
            const Logs = require('../models/Logs');

            // Find all deployments for this project
            const deployments = await Deployment.find({ projectId: id });
            const deploymentIds = deployments.map(d => d._id);

            if (deploymentIds.length > 0) {
                // Delete logs for all deployments
                const deletedLogs = await Logs.deleteMany({
                    deploymentId: { $in: deploymentIds }
                });

                // Delete deployments
                const deletedDeployments = await Deployment.deleteMany({ projectId: id });

                logger.info('Deployments and logs deleted', {
                    ...logContext,
                    deletedDeployments: deletedDeployments.deletedCount,
                    deletedLogs: deletedLogs.deletedCount
                });
            }
        } catch (deploymentError) {
            logger.warn('Failed to delete deployments and logs', {
                ...logContext,
                error: deploymentError.message
            });
        }

        // 3. Delete the project from database
        await Project.findOneAndDelete(query);

        logger.info('Project and all related records deleted successfully', logContext);
        return res.apiSuccess(null, 'Project and all associated resources deleted successfully');
    } catch (err) {
        logger.error('Failed to delete project', {
            ...logContext,
            error: err.message,
            stack: err.stack
        });

        return res.apiServerError('Failed to delete project', err.message);
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
};
const Project = require("../models/Project");
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

// Create New Project
const createProject = async (req, res) => {
    const { name, repoUrl, framework, branch = 'main', description } = req.body;

    const logContext = {
        userId: req.user._id,
        projectName: name,
        framework,
        branch
    };

    try {
        logger.info('Creating new project', logContext);

        // Generate unique subdomain
        const subdomain = generateSubdomain(name);
        logContext.subdomain = subdomain;

        // Create new project document
        const project = await Project.create({
            ownerId: req.user._id,
            name,
            description,
            repoUrl,
            framework,
            branch,
            subdomain,
        });

        logger.info('Project created successfully', {
            ...logContext,
            projectId: project._id
        });

        return res.apiCreated(project, 'Project created successfully');
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

// Get all projects of current user
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

// Get project by ID
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

// Update project
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

// Delete project
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

        const project = await Project.findOneAndDelete(query);

        if (!project) {
            logger.warn('Project not found for deletion', logContext);
            return res.apiNotFound('Project');
        }

        logger.info('Project deleted successfully', logContext);
        return res.apiSuccess(null, 'Project deleted successfully');
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
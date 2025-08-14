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

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (err) {
        logger.error('Failed to create project', { 
            ...logContext, 
            error: err.message,
            stack: err.stack 
        });
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: `${field} already exists`,
                details: { [field]: `${field} must be unique` }
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Failed to create project',
            requestId: req.id
        });
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
        
        const projects = await Project.find({ ownerId: req.user._id })
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Project.countDocuments({ ownerId: req.user._id });

        logger.info(`Fetched ${projects.length} projects`, { 
            ...logContext,
            total,
            count: projects.length 
        });

        res.json({
            success: true,
            data: projects,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('Failed to fetch projects', { 
            ...logContext, 
            error: err.message,
            stack: err.stack 
        });
        
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Failed to fetch projects',
            requestId: req.id
        });
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
        
        const project = await Project.findOne({ 
            _id: id, 
            ownerId: req.user._id 
        });

        if (!project) {
            logger.warn('Project not found', logContext);
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Project not found'
            });
        }

        logger.info('Project fetched successfully', logContext);
        res.json({ success: true, data: project });
    } catch (err) {
        logger.error('Failed to fetch project', { 
            ...logContext, 
            error: err.message,
            stack: err.stack 
        });
        
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Failed to fetch project',
            requestId: req.id
        });
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
        
        const project = await Project.findOneAndUpdate(
            { _id: id, ownerId: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!project) {
            logger.warn('Project not found for update', logContext);
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Project not found'
            });
        }

        logger.info('Project updated successfully', logContext);
        res.json({ success: true, data: project });
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
            
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'Invalid input data',
                details: errors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Failed to update project',
            requestId: req.id
        });
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
        
        const project = await Project.findOneAndDelete({ 
            _id: id, 
            ownerId: req.user._id 
        });

        if (!project) {
            logger.warn('Project not found for deletion', logContext);
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Project not found'
            });
        }

        logger.info('Project deleted successfully', logContext);
        res.json({ 
            success: true, 
            data: { 
                message: 'Project deleted successfully' 
            } 
        });
    } catch (err) {
        logger.error('Failed to delete project', { 
            ...logContext, 
            error: err.message,
            stack: err.stack 
        });
        
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Failed to delete project',
            requestId: req.id
        });
    }
};

module.exports = { 
    createProject, 
    getProjects, 
    getProjectById, 
    updateProject, 
    deleteProject 
};
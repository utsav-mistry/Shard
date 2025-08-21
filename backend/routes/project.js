/**
 * @fileoverview Project Routes
 * @description Express routes for project management, deployment, and CRUD operations
 * @module routes/project
 * @requires express
 * @requires ../controllers/projectController
 * @requires ../middleware/auth
 * @requires ../middleware/validate
 * @author Utsav Mistry
 * @version 1.0.0
 */

/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Project management operations
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - repoUrl
 *         - framework
 *       properties:
 *         id:
 *           type: string
 *           description: Project ID
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           description: Project name
 *           example: My Awesome Project
 *         repoUrl:
 *           type: string
 *           format: uri
 *           description: GitHub repository URL
 *           example: https://github.com/user/repo.git
 *         framework:
 *           type: string
 *           enum: [mern, django, flask]
 *           description: Project framework
 *           example: mern
 *         subdomain:
 *           type: string
 *           description: Generated subdomain for deployment
 *           example: my-awesome-project-abcde
 *         deploymentUrl:
 *           type: string
 *           format: uri
 *           description: Live deployment URL
 *           example: https://my-awesome-project-abcde.shard.host
 *         status:
 *           type: string
 *           enum: [pending, deploying, deployed, failed]
 *           description: Project deployment status
 *           example: deployed
 *         userId:
 *           type: string
 *           description: Owner user ID
 *           example: 60d0fe4f5311236168a109cb
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Project creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     CreateProjectRequest:
 *       type: object
 *       required:
 *         - name
 *         - repoUrl
 *         - framework
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *           minLength: 1
 *           maxLength: 100
 *           example: My New Project
 *         repoUrl:
 *           type: string
 *           format: uri
 *           description: GitHub repository URL
 *           example: https://github.com/user/new-repo.git
 *         framework:
 *           type: string
 *           enum: [mern, django, flask]
 *           description: Project framework
 *           example: flask
 *         envVars:
 *           type: array
 *           description: Environment variables
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Environment variable key
 *                 example: DATABASE_URL
 *               value:
 *                 type: string
 *                 description: Environment variable value
 *                 example: mongodb://localhost:27017/mydb
 *               secret:
 *                 type: boolean
 *                 description: Whether variable is secret
 *                 example: true
 *     
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Updated project name
 *           example: My Updated Project Name
 *         repoUrl:
 *           type: string
 *           format: uri
 *           description: Updated repository URL
 *           example: https://github.com/user/updated-repo.git
 *         framework:
 *           type: string
 *           enum: [mern, django, flask]
 *           description: Updated framework
 *           example: django
 */

const express = require('express');
const Joi = require('joi');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Import the auth middleware
const { authenticate } = require('../middleware/auth');
const validateMw = require('../middleware/validate');

// Use the authenticate middleware directly
const protect = authenticate;

// Simple wrapper for the validate middleware
const validate = (schema) => {
  if (!validateMw) {
    console.warn('project.js: validate middleware not found — using NOOP validate');
    return (req, res, next) => next();
  }

  // If validate is a function (direct export), use it directly
  if (typeof validateMw === 'function') {
    return validateMw(schema);
  }

  // If it's an object with a validate method, use that
  if (typeof validateMw.validate === 'function') {
    return validateMw.validate(schema);
  }

  // Handle default exports (ES modules)
  if (validateMw.default) {
    if (typeof validateMw.default === 'function') {
      return validateMw.default(schema);
    }
    if (typeof validateMw.default.validate === 'function') {
      return validateMw.default.validate(schema);
    }
  }

  console.warn('project.js: validate middleware export shape unexpected — using NOOP validate');
  return (req, res, next) => next();
};

const router = express.Router();

// Common validation patterns
const objectIdPattern = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required();

// Helper function to validate object ID
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      message: 'Project ID must be a valid MongoDB ObjectId'
    });
  }
  next();
};

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *                   example: Project created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/",
  protect,
  (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().min(3).max(50).required(),
      description: Joi.string().max(500).optional(),
      repoUrl: Joi.string().uri().required()
        .messages({
          'string.uri': 'Please provide a valid repository URL',
          'any.required': 'Repository URL is required'
        }),
      branch: Joi.string().default('main'),
      framework: Joi.string().valid('mern', 'flask', 'django').required()
        .messages({
          'any.only': 'Framework must be one of: mern, flask, django',
          'any.required': 'Framework is required'
        }),
      buildCommand: Joi.string().optional(),
      outputDirectory: Joi.string().optional(),
      installCommand: Joi.string().optional()
    }).unknown(true);

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    next();
  },
  createProject
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: A list of projects retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *                   example: Projects retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/",
  protect,
  validate('pagination', 'query'),
  getProjects
);

router.get("/:id",
  protect,
  validateObjectId,
  getProjectById
);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update an existing project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:id",
  protect,
  validateObjectId,
  (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().min(3).max(50).optional(),
      description: Joi.string().max(500).optional(),
      repoUrl: Joi.string().uri().optional(),
      branch: Joi.string().optional(),
      framework: Joi.string().valid('mern', 'flask', 'django').optional(),
      buildCommand: Joi.string().optional(),
      outputDirectory: Joi.string().optional(),
      installCommand: Joi.string().optional()
    }).min(1); // At least one field should be present for update

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    next();
  },
  updateProject
);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id",
  protect,
  validateObjectId,
  deleteProject
);

// Check subdomain availability
router.get("/check-subdomain/:subdomain", protect, async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Validate subdomain format
    const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainPattern.test(subdomain)) {
      return res.apiValidationError(
        { subdomain: 'Invalid subdomain format' },
        'Invalid subdomain format'
      );
    }
    
    const Project = require('../models/Project');
    const existingProject = await Project.findOne({ subdomain });
    
    return res.apiSuccess({
      available: !existingProject,
      subdomain
    }, existingProject ? 'Subdomain is already taken' : 'Subdomain is available');
    
  } catch (error) {
    return res.apiServerError('Failed to check subdomain availability', error.message);
  }
});

/**
 * @namespace projectRoutes
 * @description Express router for project management and deployment endpoints
 */
module.exports = router;

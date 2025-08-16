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
 * /projects:
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
 *             type: object
 *             required:
 *               - name
 *               - repoUrl
 *               - framework
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "my-awesome-project"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "A brief description of my project"
 *               repoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://github.com/username/repo"
 *                 description: The URL of the Git repository
 *               branch:
 *                 type: string
 *                 default: "main"
 *                 example: "main"
 *               framework:
 *                 type: string
 *                 enum: [mern, flask, django]
 *                 example: "mern"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - validation error
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
    }).unknown(false);

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
 * /projects:
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
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/",
  protect,
  validate('pagination', 'query'),
  getProjects
);

/**
 * @swagger
 * /projects/{id}:
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
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found
 */
router.get("/:id",
  protect,
  validateObjectId,
  getProjectById
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
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
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProject'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input or project ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found
 */
router.put("/:id",
  protect,
  validateObjectId,
  (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().min(3).max(50).optional(),
      description: Joi.string().max(500).optional(),
      repository: Joi.string().uri().optional(),
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
 * /projects/{id}:
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
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Invalid project ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found
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

module.exports = router;

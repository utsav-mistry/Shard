/**
 * @swagger
 * components:
 *   schemas:
 *     EnvVar:
 *       type: object
 *       required:
 *         - key
 *         - value
 *         - projectId
 *       properties:
 *         id:
 *           type: string
 *           description: Environment variable ID
 *         key:
 *           type: string
 *           description: Environment variable key (UPPER_SNAKE_CASE)
 *           pattern: '^[A-Z][A-Z0-9_]*$'
 *         value:
 *           type: string
 *           description: Environment variable value
 *         secret:
 *           type: boolean
 *           default: false
 *           description: Whether the variable is secret
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     CreateEnvVarRequest:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Environment variable key
 *           pattern: '^[A-Z][A-Z0-9_]*$'
 *           example: DATABASE_URL
 *         value:
 *           type: string
 *           description: Environment variable value
 *           example: postgresql://localhost:5432/mydb
 *         secret:
 *           type: boolean
 *           default: false
 *           description: Whether the variable is secret
 *     
 *     BulkEnvVarsRequest:
 *       type: object
 *       required:
 *         - envVars
 *       properties:
 *         envVars:
 *           type: array
 *           description: Array of environment variables
 *           items:
 *             $ref: '#/components/schemas/CreateEnvVarRequest'
 * 
 * tags:
 *   - name: Environment Variables
 *     description: Environment variable management operations
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable merging of params from parent route
const { authenticate } = require('../middleware/auth');
const { validateEnvVar, sanitizeBody } = require('../utils/validation');
const envController = require('../controllers/envController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Middleware to ensure projectId is available in request body
router.use((req, res, next) => {
    // Get projectId from URL params or middleware-set projectId
    const projectId = req.projectId || (req.params && req.params.projectId);
    if (!req.body) {
        req.body = {};
    }
    if (!req.body.projectId && projectId) {
        req.body.projectId = projectId;
    }
    next();
});

/**
 * @swagger
 * /api/projects/{projectId}/env:
 *   post:
 *     summary: Create environment variable(s) for a project
 *     description: Create a single environment variable or bulk create multiple environment variables for a project
 *     tags: [Environment Variables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateEnvVarRequest'
 *               - $ref: '#/components/schemas/BulkEnvVarsRequest'
 *           examples:
 *             single:
 *               summary: Single environment variable
 *               value:
 *                 key: DATABASE_URL
 *                 value: postgresql://localhost:5432/mydb
 *                 secret: true
 *             bulk:
 *               summary: Multiple environment variables
 *               value:
 *                 envVars:
 *                   - key: DATABASE_URL
 *                     value: postgresql://localhost:5432/mydb
 *                     secret: true
 *                   - key: API_KEY
 *                     value: your-api-key-here
 *                     secret: true
 *     responses:
 *       201:
 *         description: Environment variable(s) created successfully
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
 *                   example: Environment variable created successfully
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/EnvVar'
 *                     - type: array
 *                       items:
 *                         $ref: '#/components/schemas/EnvVar'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found
 */
// Create environment variable for a project (single)
router.post(
    '/',
    sanitizeBody,
    (req, res, next) => {
        // Check if this is a bulk request
        if (req.body.envVars && Array.isArray(req.body.envVars)) {
            return envController.addBulkEnvVars(req, res);
        }
        
        // Validate that the request has the required fields for single env var
        if (!req.body.key || !req.body.value) {
            return res.status(400).json({ success: false, message: 'Key and value are required' });
        }
        next();
    },
    validateEnvVar,
    envController.addEnvVar
);

/**
 * @swagger
 * /api/projects/{projectId}/env:
 *   get:
 *     summary: Get all environment variables for a project
 *     description: Retrieve all environment variables associated with a specific project
 *     tags: [Environment Variables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Environment variables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnvVar'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found
 */
// Get all environment variables for a project
router.get('/', envController.getEnvVars);

/**
 * @swagger
 * /api/projects/{projectId}/env/{id}:
 *   get:
 *     summary: Get environment variable by ID
 *     description: Retrieve a specific environment variable by its ID
 *     tags: [Environment Variables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Environment variable ID
 *     responses:
 *       200:
 *         description: Environment variable retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnvVar'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Environment variable not found
 */
// Get a specific environment variable by ID
router.get('/:id', envController.getEnvVarById);

/**
 * @swagger
 * /api/projects/{projectId}/env/{id}:
 *   put:
 *     summary: Update environment variable
 *     description: Update a specific environment variable by its ID
 *     tags: [Environment Variables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Environment variable ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnvVarRequest'
 *           example:
 *             key: DATABASE_URL
 *             value: postgresql://localhost:5432/updated_db
 *             secret: true
 *     responses:
 *       200:
 *         description: Environment variable updated successfully
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
 *                   example: Environment variable updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/EnvVar'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Environment variable not found
 */
// Update a specific environment variable
router.put('/:id', sanitizeBody, validateEnvVar, envController.updateEnvVar);

/**
 * @swagger
 * /api/projects/{projectId}/env/{id}:
 *   delete:
 *     summary: Delete environment variable
 *     description: Delete a specific environment variable by its ID
 *     tags: [Environment Variables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Environment variable ID
 *     responses:
 *       200:
 *         description: Environment variable deleted successfully
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
 *                   example: Environment variable deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Environment variable not found
 */
// Delete a specific environment variable
router.delete('/:id', envController.deleteEnvVar);

module.exports = router;

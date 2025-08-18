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

// Create environment variable for a project
router.post(
    '/',
    sanitizeBody,
    (req, res, next) => {
        // Ensure key is uppercase
        if (req.body.key) {
            req.body.key = req.body.key.toUpperCase();
        }
        next();
    },
    validateEnvVar,
    envController.addEnvVar
);

// Get all environment variables for a project
router.get('/', envController.getEnvVars);

// Update a specific environment variable
router.put('/:id', sanitizeBody, validateEnvVar, envController.updateEnvVar);

// Delete a specific environment variable
router.delete('/:id', envController.deleteEnvVar);

module.exports = router;

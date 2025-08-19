/**
 * @fileoverview Validation Utilities
 * @description Provides Joi validation schemas and middleware for request validation
 * @module utils/validation
 * @requires joi
 * @author Utsav Mistry
 * @version 1.0.0
 */

const Joi = require('joi');

/**
 * Validation schemas for different entities
 */
const projectSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    repoUrl: Joi.string().uri().required(),
    stack: Joi.string().valid('mern', 'django', 'flask').required(),
    framework: Joi.string().valid('mern', 'django', 'flask').optional(),
    subdomain: Joi.string().optional(),
    branch: Joi.string().optional().default('main')
}).options({ allowUnknown: true });

/**
 * Joi schema for environment variable validation
 * @type {Joi.ObjectSchema}
 */
const envVarSchema = Joi.object({
    key: Joi.string().min(1).max(100).pattern(/^[A-Z_][A-Z0-9_]*$/).required(),
    value: Joi.string().max(1000).required(),
    projectId: Joi.string().hex().length(24).optional()
}).options({ allowUnknown: true });

/**
 * Joi schema for deployment validation
 * @type {Joi.ObjectSchema}
 */
const deploymentSchema = Joi.object({
    projectId: Joi.string().hex().length(24).required(),
    branch: Joi.string().min(1).max(100).optional().default('main'),
    commitHash: Joi.string().max(100).optional(),
    message: Joi.string().max(500).optional(),
    environmentVariables: Joi.array().items(Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
        isSecret: Joi.boolean().optional().default(false)
    })).optional().default([])
}).options({ allowUnknown: true });

/**
 * Validation middleware for project creation/update
 * @function validateProject
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 * @example
 * router.post('/projects', validateProject, createProject);
 */
const validateProject = (req, res, next) => {
    const { error } = projectSchema.validate(req.body);
    if (error) {
        const errors = {};
        error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message;
        });
        return res.apiValidationError(errors, 'Project validation failed');
    }
    next();
};

/**
 * Validation middleware for environment variables
 * @function validateEnvVar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 * @example
 * router.post('/env-vars', validateEnvVar, createEnvVar);
 */
const validateEnvVar = (req, res, next) => {
    // Create a copy of req.body without projectId for validation
    const { projectId, ...bodyWithoutProjectId } = req.body;
    
    const { error } = envVarSchema.validate(bodyWithoutProjectId, { allowUnknown: true });
    if (error) {
        const errors = {};
        error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message;
        });
        return res.apiValidationError(errors, 'Environment variable validation failed');
    }
    next();
};

/**
 * Validation middleware for deployment requests
 * @function validateDeployment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 * @example
 * router.post('/deployments', validateDeployment, createDeployment);
 */
const validateDeployment = (req, res, next) => {
    const { error } = deploymentSchema.validate(req.body);
    if (error) {
        const errors = {};
        error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message;
        });
        return res.apiValidationError(errors, 'Deployment validation failed');
    }
    next();
};

/**
 * Sanitizes input by trimming whitespace and removing dangerous characters
 * @function sanitizeInput
 * @param {*} input - Input value to sanitize
 * @returns {*} Sanitized input
 * @example
 * const clean = sanitizeInput('<script>alert("xss")</script>');
 * // Returns: 'scriptalert("xss")/script'
 */
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

/**
 * Middleware to sanitize all fields in request body
 * @function sanitizeBody
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 * @example
 * router.use(sanitizeBody);
 */
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitizeInput(req.body[key]);
        });
    }
    next();
};

/**
 * @namespace validation
 * @description Collection of validation utilities and middleware
 */
module.exports = {
    validateProject,
    validateEnvVar,
    validateDeployment,
    sanitizeBody,
    sanitizeInput,
    // Export schemas for direct use if needed
    schemas: {
        projectSchema,
        envVarSchema,
        deploymentSchema
    }
}; 
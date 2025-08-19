/**
 * @fileoverview Validation Middleware
 * @description Joi-based request validation middleware with comprehensive schemas
 *              for authentication, projects, deployments, and data validation
 * @author Utsav Mistry
 * @version 1.0.0
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Common validation patterns used across different schemas
 * @constant {Object} patterns
 * @property {Joi.StringSchema} email - Email validation with required constraint
 * @property {Joi.StringSchema} password - Password with minimum 8 characters
 * @property {Joi.StringSchema} objectId - MongoDB ObjectId pattern validation
 * @property {Joi.StringSchema} url - URI validation for URLs
 * @property {Joi.StringSchema} subdomain - Subdomain pattern (lowercase alphanumeric with hyphens)
 * @property {Joi.ObjectSchema} envVars - Environment variables pattern (UPPER_SNAKE_CASE keys)
 */
const patterns = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  url: Joi.string().uri(),
  subdomain: Joi.string().pattern(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  envVars: Joi.object().pattern(/^[A-Z_][A-Z0-9_]*$/, Joi.string())
};

/**
 * Pre-defined validation schemas for common request types
 * @constant {Object} schemas
 * @property {Joi.ObjectSchema} login - User login validation
 * @property {Joi.ObjectSchema} createProject - Project creation validation
 * @property {Joi.ObjectSchema} createDeployment - Deployment creation validation
 * @property {Joi.ObjectSchema} updateEnvVars - Environment variables update validation
 * @property {Joi.ObjectSchema} registerUser - User registration validation
 * @property {Joi.ObjectSchema} pagination - Pagination parameters validation
 */
const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: patterns.email,
    password: patterns.password
  }),

  // Project management schemas
  createProject: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(500),
    subdomain: patterns.subdomain.required(),
    repoUrl: patterns.url.required(),
    branch: Joi.string().default('main'),
    framework: Joi.string().valid('mern', 'flask', 'django').required()
      .description('Supported frameworks: mern, flask, django'),
    buildCommand: Joi.string(),
    outputDirectory: Joi.string(),
    installCommand: Joi.string()
  }),

  // Deployment schemas
  createDeployment: Joi.object({
    projectId: patterns.objectId.required(),
    branch: Joi.string().required(),
    commitHash: Joi.string().length(40).required(),
    commitMessage: Joi.string().required(),
    commitAuthor: Joi.string().required(),
    commitUrl: patterns.url.required(),
    environment: Joi.string().valid('production', 'staging', 'development').default('production')
  }),

  // Environment variable schemas
  updateEnvVars: Joi.object({
    variables: patterns.envVars.required()
  }),

  // User management schemas
  registerUser: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: patterns.email,
    password: patterns.password,
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  // Utility schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/),
    search: Joi.string().trim()
  })
};

/**
 * Create validation middleware for request data validation
 * @function validate
 * @param {Joi.Schema|string} schema - Joi schema object or schema name from schemas object
 * @param {string} [property='body'] - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 * @description Validates request data against Joi schema with comprehensive error handling
 * @note Supports both direct Joi schema objects and string references to predefined schemas
 * @note Strips unknown properties and provides detailed validation error messages
 * @note Logs validation failures with request context for debugging
 * @example
 * // Using predefined schema
 * app.post('/login', validate('login'), loginController);
 * 
 * // Using custom schema
 * const customSchema = Joi.object({ name: Joi.string().required() });
 * app.post('/custom', validate(customSchema), customController);
 * 
 * // Validating query parameters
 * app.get('/search', validate('pagination', 'query'), searchController);
 */
const validate = (schema, property = 'body') => {
  if (!(schema instanceof Joi.constructor || schema.isJoi)) {
    // If schema is a string, try to get it from schemas object
    if (typeof schema === 'string' && schemas[schema]) {
      schema = schemas[schema];
    } else {
      throw new Error(`Invalid schema provided to validate()`);
    }
  }

  return (req, res, next) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      logger.warn('Validation failed', {
        errors: error.details,
        requestId: req.id,
        path: req.path,
        method: req.method
      });

      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors,
        requestId: req.id
      });
    }

    // Replace req[property] with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Create middleware to validate URL parameters against a predefined schema
 * @function validateParams
 * @param {string} schemaName - Name of schema from schemas object
 * @returns {Function} Express middleware function for parameter validation
 * @description Convenience function for validating req.params using predefined schemas
 * @example
 * // Validate ObjectId in URL parameters
 * app.get('/users/:id', validateParams('objectId'), getUserController);
 */
const validateParams = (schemaName) => validate(schemaName, 'params');

/**
 * Create middleware to validate query string parameters against a predefined schema
 * @function validateQuery
 * @param {string} schemaName - Name of schema from schemas object
 * @returns {Function} Express middleware function for query validation
 * @description Convenience function for validating req.query using predefined schemas
 * @example
 * // Validate pagination parameters
 * app.get('/projects', validateQuery('pagination'), getProjectsController);
 */
const validateQuery = (schemaName) => validate(schemaName, 'query');

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas
};

const Joi = require('joi');
const logger = require('../utils/logger');

// Common validation patterns
const patterns = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  url: Joi.string().uri(),
  subdomain: Joi.string().pattern(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  envVars: Joi.object().pattern(/^[A-Z_][A-Z0-9_]*$/, Joi.string())
};

// Common schemas
const schemas = {
  // Auth
  login: Joi.object({
    email: patterns.email,
    password: patterns.password
  }),

  // Project
  createProject: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(500),
    subdomain: patterns.subdomain.required(),
    repository: patterns.url.required(),
    branch: Joi.string().default('main'),
    framework: Joi.string().valid('mern', 'flask', 'django').required()
      .description('Supported frameworks: mern, flask, django'),
    buildCommand: Joi.string(),
    outputDirectory: Joi.string(),
    installCommand: Joi.string()
  }),

  // Deployment
  createDeployment: Joi.object({
    projectId: patterns.objectId.required(),
    branch: Joi.string().required(),
    commitHash: Joi.string().length(40).required(),
    commitMessage: Joi.string().required(),
    commitAuthor: Joi.string().required(),
    commitUrl: patterns.url.required(),
    environment: Joi.string().valid('production', 'staging', 'development').default('production')
  }),

  // Environment Variables
  updateEnvVars: Joi.object({
    variables: patterns.envVars.required()
  }),

  // User
  registerUser: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: patterns.email,
    password: patterns.password,
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/),
    search: Joi.string().trim()
  })
};

/**
 * Middleware factory that validates request data against a Joi schema
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} [property='body'] - Property on req to validate (body, params, query)
 * @returns {Function} Express middleware function
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
        schema: schemaName,
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
 * Middleware to validate request parameters against a schema
 */
const validateParams = (schemaName) => validate(schemaName, 'params');

/**
 * Middleware to validate query parameters against a schema
 */
const validateQuery = (schemaName) => validate(schemaName, 'query');

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas
};

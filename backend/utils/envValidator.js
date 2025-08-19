/**
 * @fileoverview Environment Variable Validator
 * @description Validates environment variables against a defined schema
 * and provides helpful error messages for missing or invalid variables
 * @module utils/envValidator
 * @requires fs
 * @requires path
 * @requires ./logger
 * @author Utsav Mistry
 * @version 1.0.0
 */

const logger = require('./logger');

/**
 * Environment variable validation utility
 * Ensures all required environment variables are present and valid
 */

/**
 * @typedef {Object} EnvVarSchema
 * @property {boolean} required - Whether the variable is required
 * @property {string} type - Expected type ('string', 'number', 'boolean', 'array')
 * @property {Array} allowedValues - Allowed values for the variable
 * @property {number} min - Minimum value (for numbers)
 * @property {number} max - Maximum value (for numbers)
 * @property {number} minLength - Minimum length (for strings/arrays)
 * @property {number} maxLength - Maximum length (for strings/arrays)
 * @property {RegExp} pattern - Regex pattern the value must match
 * @property {string} default - Default value if not provided
 * @property {string} description - Description of the variable
 */

const requiredEnvVars = {
    // Core application settings
    /**
     * @description Node.js environment (development, production, test)
     * @type {EnvVarSchema}
     */
    NODE_ENV: {
        required: true,
        type: 'string',
        allowedValues: ['development', 'production', 'test'],
        default: 'development'
    },
    /**
     * @description Server port number
     * @type {EnvVarSchema}
     */
    PORT: {
        required: true,
        type: 'number',
        min: 1000,
        max: 65535,
        default: 5000
    },

    // Database
    /**
     * @description MongoDB connection string
     * @type {EnvVarSchema}
     */
    MONGO_URI: {
        required: true,
        type: 'string',
        pattern: /^mongodb(\+srv)?:\/\/.+/,
        description: 'MongoDB connection string'
    },

    // Authentication
    /**
     * @description JWT secret key (minimum 32 characters)
     * @type {EnvVarSchema}
     */
    JWT_SECRET: {
        required: true,
        type: 'string',
        minLength: 32,
        description: 'JWT secret key (minimum 32 characters)'
    },
    /**
     * @description JWT expiration time (e.g., 7d, 24h, 60m)
     * @type {EnvVarSchema}
     */
    JWT_EXPIRE: {
        required: false,
        type: 'string',
        default: '7d',
        pattern: /^\d+[dhms]$/,
        description: 'JWT expiration time (e.g., 7d, 24h, 60m)'
    },

    // Encryption
    /**
     * @description Encryption secret key (minimum 32 characters)
     * @type {EnvVarSchema}
     */
    ENCRYPTION_SECRET: {
        required: true,
        type: 'string',
        minLength: 32,
        description: 'Encryption secret key (minimum 32 characters)'
    },

    // External services
    /**
     * @description Deployment worker service URL
     * @type {EnvVarSchema}
     */
    DEPLOYMENT_WORKER_URL: {
        required: false,
        type: 'string',
        pattern: /^https?:\/\/.+/,
        default: 'http://localhost:9000',
        description: 'Deployment worker service URL'
    },
    /**
     * @description AI review service URL
     * @type {EnvVarSchema}
     */
    AI_SERVICE_URL: {
        required: false,
        type: 'string',
        pattern: /^https?:\/\/.+/,
        default: 'http://localhost:8000',
        description: 'AI review service URL'
    },

    // Security
    /**
     * @description CORS allowed origins
     * @type {EnvVarSchema}
     */
    CORS_ORIGIN: {
        required: false,
        type: 'string',
        default: 'http://localhost:3000',
        description: 'CORS allowed origins'
    }
};

/**
 * Validates a single environment variable against its schema definition
 * @private
 * @function validateEnvVar
 * @param {string} name - The name of the environment variable
 * @param {EnvVarSchema} config - Validation schema for the variable
 * @param {string} value - The value to validate
 * @returns {Array<string>} Error messages if validation fails, empty array otherwise
 */
function validateEnvVar(name, config, value) {
    const errors = [];

    // Check if required
    if (config.required && (!value || value.trim() === '')) {
        errors.push(`${name} is required but not set`);
        return errors;
    }

    // Use default if not provided
    if (!value && config.default !== undefined) {
        process.env[name] = config.default.toString();
        value = config.default.toString();
    }

    // Skip further validation if not provided and not required
    if (!value) {
        return errors;
    }

    // Type validation
    switch (config.type) {
        case 'number':
            const num = parseInt(value, 10);
            if (isNaN(num)) {
                errors.push(`${name} must be a valid number, got: ${value}`);
            } else {
                if (config.min !== undefined && num < config.min) {
                    errors.push(`${name} must be >= ${config.min}, got: ${num}`);
                }
                if (config.max !== undefined && num > config.max) {
                    errors.push(`${name} must be <= ${config.max}, got: ${num}`);
                }
                // Update env with parsed number
                process.env[name] = num.toString();
            }
            break;

        case 'string':
            if (config.minLength && value.length < config.minLength) {
                errors.push(`${name} must be at least ${config.minLength} characters long`);
            }
            if (config.maxLength && value.length > config.maxLength) {
                errors.push(`${name} must be no more than ${config.maxLength} characters long`);
            }
            if (config.pattern && !config.pattern.test(value)) {
                errors.push(`${name} format is invalid${config.description ? ': ' + config.description : ''}`);
            }
            if (config.allowedValues && !config.allowedValues.includes(value)) {
                errors.push(`${name} must be one of: ${config.allowedValues.join(', ')}, got: ${value}`);
            }
            break;
    }

    return errors;
}

/**
 * Validates all environment variables against their schema definitions
 * @function validateEnvironment
 * @returns {Object} Validation result object
 * @property {boolean} valid - Whether all required variables are present and valid
 * @property {Array<string>} errors - Array of validation error messages
 * @property {Array<string>} warnings - Array of validation warning messages
 */
function validateEnvironment() {
    const errors = [];
    const warnings = [];

    logger.info('Validating environment variables...');

    // Validate each required environment variable
    for (const [name, config] of Object.entries(requiredEnvVars)) {
        const value = process.env[name];
        const varErrors = validateEnvVar(name, config, value);
        errors.push(...varErrors);

        // Log successful validation
        if (varErrors.length === 0 && value) {
            logger.debug(`${name}: validated`);
        }
    }

    // Check for development-specific warnings
    if (process.env.NODE_ENV === 'development') {
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('change')) {
            warnings.push('JWT_SECRET appears to be a placeholder - update for security');
        }
        if (process.env.ENCRYPTION_SECRET && process.env.ENCRYPTION_SECRET.includes('change')) {
            warnings.push('ENCRYPTION_SECRET appears to be a placeholder - update for security');
        }
    }

    // Log results
    if (errors.length > 0) {
        logger.error('Environment validation failed:');
        errors.forEach(error => logger.error(`  ERROR: ${error}`));
        throw new Error(`Environment validation failed with ${errors.length} error(s)`);
    }

    if (warnings.length > 0) {
        logger.warn('Environment validation warnings:');
        warnings.forEach(warning => logger.warn(`  WARNING: ${warning}`));
    }

    logger.info(`Environment validation passed (${Object.keys(requiredEnvVars).length} variables checked)`);

    return {
        valid: true,
        errors,
        warnings
    };
}

/**
 * Get environment summary for debugging
 * @function getEnvironmentSummary
 * @returns {Object} Environment summary object
 */
function getEnvironmentSummary() {
    const summary = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_CONNECTED: !!process.env.MONGO_URI,
        EXTERNAL_SERVICES: {
            deploymentWorker: process.env.DEPLOYMENT_WORKER_URL,
            aiService: process.env.AI_SERVICE_URL
        },
        SECURITY: {
            jwtConfigured: !!process.env.JWT_SECRET,
            encryptionConfigured: !!process.env.ENCRYPTION_SECRET,
            corsOrigin: process.env.CORS_ORIGIN
        }
    };

    return summary;
}

/**
 * @namespace envValidator
 * @description Collection of environment validation utilities
 */
module.exports = {
    validateEnvironment,
    getEnvironmentSummary,
    requiredEnvVars
};
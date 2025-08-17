const logger = require('./logger');

/**
 * Environment variable validation utility
 * Ensures all required environment variables are present and valid
 */

const requiredEnvVars = {
    // Core application settings
    NODE_ENV: {
        required: true,
        type: 'string',
        allowedValues: ['development', 'production', 'test'],
        default: 'development'
    },
    PORT: {
        required: true,
        type: 'number',
        min: 1000,
        max: 65535,
        default: 5000
    },

    // Database
    MONGO_URI: {
        required: true,
        type: 'string',
        pattern: /^mongodb(\+srv)?:\/\/.+/,
        description: 'MongoDB connection string'
    },

    // Authentication
    JWT_SECRET: {
        required: true,
        type: 'string',
        minLength: 32,
        description: 'JWT secret key (minimum 32 characters)'
    },
    JWT_EXPIRE: {
        required: false,
        type: 'string',
        default: '7d',
        pattern: /^\d+[dhms]$/,
        description: 'JWT expiration time (e.g., 7d, 24h, 60m)'
    },

    // Encryption
    ENCRYPTION_SECRET: {
        required: true,
        type: 'string',
        minLength: 32,
        description: 'Encryption secret key (minimum 32 characters)'
    },

    // External services
    DEPLOYMENT_WORKER_URL: {
        required: false,
        type: 'string',
        pattern: /^https?:\/\/.+/,
        default: 'http://localhost:9000',
        description: 'Deployment worker service URL'
    },
    AI_SERVICE_URL: {
        required: false,
        type: 'string',
        pattern: /^https?:\/\/.+/,
        default: 'http://localhost:8000',
        description: 'AI review service URL'
    },

    // Security
    CORS_ORIGIN: {
        required: false,
        type: 'string',
        default: 'http://localhost:3000',
        description: 'CORS allowed origins'
    }
};

/**
 * Validate a single environment variable
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
 * Validate all environment variables
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

module.exports = {
    validateEnvironment,
    getEnvironmentSummary,
    requiredEnvVars
};
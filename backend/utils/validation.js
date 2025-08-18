const Joi = require('joi');

// Validation schemas
const projectSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    repoUrl: Joi.string().uri().required(),
    stack: Joi.string().valid('mern', 'django', 'flask').required(),
    framework: Joi.string().valid('mern', 'django', 'flask').optional(),
    subdomain: Joi.string().optional(),
    branch: Joi.string().optional().default('main')
}).options({ allowUnknown: true });

const envVarSchema = Joi.object({
    key: Joi.string().min(1).max(100).pattern(/^[A-Z_][A-Z0-9_]*$/).required(),
    value: Joi.string().max(1000).required(),
    projectId: Joi.string().hex().length(24).optional()
}).options({ allowUnknown: true });

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

// Validation middleware
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

// Input sanitization
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

const sanitizeBody = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitizeInput(req.body[key]);
        });
    }
    next();
};

module.exports = {
    validateProject,
    validateEnvVar,
    validateDeployment,
    sanitizeBody,
    sanitizeInput
}; 
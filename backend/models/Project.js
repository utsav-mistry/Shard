const mongoose = require('mongoose');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

const ProjectSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner ID is required'],
            index: true,
        },
        settings: {
            buildCommand: {
                type: String,
                default: 'npm install && npm run build'
            },
            startCommand: {
                type: String,
                default: 'npm start'
            },
            envVars: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'EnvVar'
            }]
        },
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            minlength: [3, 'Project name must be at least 3 characters'],
            maxlength: [100, 'Project name cannot exceed 100 characters'],
        },
        repoUrl: {
            type: String,
            required: [true, 'Repository URL is required'],
            trim: true,
            validate: {
                validator: function (v) {
                    // Basic URL validation
                    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(v);
                },
                message: props => `${props.value} is not a valid repository URL`
            },
        },
        framework: {
            type: String,
            enum: {
                values: ['mern', 'django', 'flask', 'node', 'react', 'nextjs', 'vue', 'angular'],
                message: 'Framework {VALUE} is not supported'
            },
            required: [true, 'Framework is required'],
        },
        subdomain: {
            type: String,
            required: [true, 'Subdomain is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Please enter a valid subdomain'],
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'deleted'],
            default: 'active',
        },
        lastDeployedAt: Date,
        lastDeploymentStatus: {
            type: String,
            enum: ['success', 'failed', 'pending', null],
            default: null,
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        },
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                if (ret.settings && ret.settings.envVars) {
                    delete ret.settings.envVars; // Don't expose env vars by default
                }
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                if (ret.settings && ret.settings.envVars) {
                    delete ret.settings.envVars; // Don't expose env vars by default
                }
                return ret;
            }
        },
    }
);

// Indexes for better query performance
ProjectSchema.index({ ownerId: 1, name: 1 }, { unique: true });
ProjectSchema.index({ status: 1, lastDeployedAt: -1 });

// Virtual for project URL with subdomain.localhost:port format
ProjectSchema.virtual('url').get(function () {
    const PORT_CONFIG = {
        mern: { backend: 12000, frontend: 12001 },
        django: { backend: 13000 },
        flask: { backend: 14000 },
    };
    
    const ports = PORT_CONFIG[this.framework?.toLowerCase()];
    if (!ports) return `http://${this.subdomain || 'app'}.localhost:3000`;
    
    if (this.framework?.toLowerCase() === 'mern' && ports.frontend) {
        return `http://${this.subdomain || 'app'}.localhost:${ports.frontend}`;
    }
    
    return `http://${this.subdomain || 'app'}.localhost:${ports.backend}`;
});

// Pre-save hook to validate subdomain uniqueness
ProjectSchema.pre('save', async function (next) {
    if (this.isModified('subdomain')) {
        const existing = await this.constructor.findOne({
            subdomain: this.subdomain,
            _id: { $ne: this._id } // Exclude current document when updating
        });

        if (existing) {
            const err = new Error('Subdomain is already in use');
            err.name = 'ValidationError';
            return next(err);
        }
    }
    next();
});

// Post-save hook to clear cache
ProjectSchema.post('save', async function (doc) {
    try {
        // Clear project cache
        await cacheService.del(`project:${doc._id}`);
        // Clear owner's projects list cache
        await cacheService.del(`user:${doc.ownerId}:projects`);
    } catch (error) {
        logger.error('Error clearing project cache after save:', error);
    }
});

// Post-remove hook to clear cache and related data
ProjectSchema.post('remove', async function (doc) {
    try {
        // Clear project cache
        await cacheService.del(`project:${doc._id}`);
        // Clear owner's projects list cache
        await cacheService.del(`user:${doc.ownerId}:projects`);

        // TODO: Clean up related deployments, logs, etc.
        // This would be implemented when we have those models
    } catch (error) {
        logger.error('Error cleaning up after project removal:', error);
    }
});

// Static method to find projects by owner with caching
ProjectSchema.statics.findByOwner = async function (ownerId, useCache = true) {
    const cacheKey = `user:${ownerId}:projects`;

    if (useCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return { projects: cached, fromCache: true };
        }
    }

    const projects = await this.find({ ownerId, status: { $ne: 'deleted' } })
        .sort({ updatedAt: -1 });

    // Cache for 5 minutes
    if (projects.length > 0) {
        await cacheService.set(cacheKey, projects, 300);
    }

    return { projects, fromCache: false };
};

// Static method to get project by ID with caching
ProjectSchema.statics.getById = async function (projectId, useCache = true) {
    const cacheKey = `project:${projectId}`;

    if (useCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return { project: cached, fromCache: true };
        }
    }

    const project = await this.findById(projectId);

    if (project) {
        // Cache for 1 hour
        await cacheService.set(cacheKey, project, 3600);
    }

    return { project, fromCache: false };
};

// Add text index for search
ProjectSchema.index({
    name: 'text',
    subdomain: 'text',
    'settings.buildCommand': 'text',
    'settings.startCommand': 'text'
}, {
    weights: {
        name: 10,
        subdomain: 5,
        'settings.buildCommand': 2,
        'settings.startCommand': 2
    },
    name: 'project_search_index'
});

// Add a method to get deployment status
ProjectSchema.methods.getDeploymentStatus = function () {
    if (!this.lastDeployedAt) return 'never-deployed';

    const now = new Date();
    const hoursSinceLastDeploy = (now - this.lastDeployedAt) / (1000 * 60 * 60);

    if (hoursSinceLastDeploy < 1) return 'recent';
    if (hoursSinceLastDeploy < 24) return 'today';
    if (hoursSinceLastDeploy < 168) return 'this-week';
    return 'stale';
};

// Add a method to get project metrics
ProjectSchema.methods.getMetrics = async function () {
    // This would be implemented with actual metrics collection
    return {
        uptime: 99.9, // Example uptime percentage
        lastDeployed: this.lastDeployedAt,
        deploymentStatus: this.lastDeploymentStatus,
        deploymentHealth: this.getDeploymentStatus(),
        containerCount: 1, // Would come from container orchestration
        resourceUsage: {
            cpu: '10%',
            memory: '256MB / 1GB',
            storage: '500MB / 10GB'
        }
    };
};

// Add a method to trigger a deployment
ProjectSchema.methods.triggerDeployment = async function (userId, branch = 'main') {
    // This would be implemented with your deployment logic
    logger.info(`Triggering deployment for project ${this._id} by user ${userId} on branch ${branch}`);

    // Update deployment status
    this.lastDeployedAt = new Date();
    this.lastDeploymentStatus = 'pending';
    await this.save();

    // TODO: Trigger actual deployment process

    return { success: true, message: 'Deployment started' };
};

module.exports = mongoose.model('Project', ProjectSchema);

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

const DeploymentSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'building', 'deploying', 'running', 'success', 'failed', 'cancelled'],
                message: 'Status {VALUE} is not supported'
            },
            default: 'pending',
            index: true,
        },
        branch: {
            type: String,
            default: 'main',
            trim: true,
        },
        commitHash: {
            type: String,
            trim: true,
        },
        commitMessage: {
            type: String,
            trim: true,
        },
        buildLogs: {
            type: String,
            default: '',
        },
        deploymentLogs: {
            type: String,
            default: '',
        },
        errorMessage: {
            type: String,
            trim: true,
        },
        buildTime: {
            type: Number, // in milliseconds
        },
        deploymentTime: {
            type: Number, // in milliseconds
        },
        url: {
            type: String,
            trim: true,
        },
        environment: {
            type: String,
            enum: ['development', 'staging', 'production'],
            default: 'production',
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
        startedAt: {
            type: Date,
        },
        finishedAt: {
            type: Date,
        },
    },
    {
        collection: 'deployments',
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        },
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            }
        },
    }
);

// Indexes for better query performance
DeploymentSchema.index({ projectId: 1, status: 1 });
DeploymentSchema.index({ userId: 1, createdAt: -1 });
DeploymentSchema.index({ status: 1, createdAt: -1 });
DeploymentSchema.index({ createdAt: -1 });
DeploymentSchema.index({ projectId: 1, createdAt: -1 });

// Virtual for deployment duration
DeploymentSchema.virtual('duration').get(function () {
    if (this.startedAt && this.finishedAt) {
        return this.finishedAt - this.startedAt;
    }
    if (this.startedAt) {
        return Date.now() - this.startedAt;
    }
    return null;
});

// Virtual for deployment status display
DeploymentSchema.virtual('statusDisplay').get(function () {
    const statusMap = {
        pending: 'Pending',
        building: 'Building',
        deploying: 'Deploying',
        running: 'Running',
        success: 'Success',
        failed: 'Failed',
        cancelled: 'Cancelled'
    };
    return statusMap[this.status] || this.status;
});

// Pre-save hook to set timestamps
DeploymentSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'building' && !this.startedAt) {
            this.startedAt = new Date();
        }
        if (['success', 'failed', 'cancelled'].includes(this.status) && !this.finishedAt) {
            this.finishedAt = new Date();
        }
    }
    next();
});

// Post-save hook to clear cache
DeploymentSchema.post('save', async function (doc) {
    try {
        // Clear deployment cache
        await cacheService.del(`deployment:${doc._id}`);
        // Clear project's deployments cache
        await cacheService.del(`project:${doc.projectId}:deployments`);
        // Clear user's deployments cache
        await cacheService.del(`user:${doc.userId}:deployments`);
    } catch (error) {
        logger.error('Error clearing deployment cache after save:', error);
    }
});

// Static method to find deployments by project with caching
DeploymentSchema.statics.findByProject = async function (projectId, useCache = true) {
    const cacheKey = `project:${projectId}:deployments`;

    if (useCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return { deployments: cached, fromCache: true };
        }
    }

    const deployments = await this.find({ projectId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .lean();

    // Cache for 5 minutes
    if (deployments.length > 0) {
        await cacheService.set(cacheKey, deployments, 300);
    }

    return { deployments, fromCache: false };
};

// Static method to find deployments by user with caching
DeploymentSchema.statics.findByUser = async function (userId, useCache = true) {
    const cacheKey = `user:${userId}:deployments`;

    if (useCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return { deployments: cached, fromCache: true };
        }
    }

    const deployments = await this.find({ userId })
        .sort({ createdAt: -1 })
        .populate('projectId', 'name subdomain')
        .lean();

    // Cache for 5 minutes
    if (deployments.length > 0) {
        await cacheService.set(cacheKey, deployments, 300);
    }

    return { deployments, fromCache: false };
};

// Method to get deployment metrics
DeploymentSchema.methods.getMetrics = function () {
    return {
        duration: this.duration,
        buildTime: this.buildTime,
        deploymentTime: this.deploymentTime,
        status: this.status,
        success: this.status === 'success',
        failed: this.status === 'failed',
        isRunning: ['pending', 'building', 'deploying'].includes(this.status)
    };
};

// Method to update deployment status with logging
DeploymentSchema.methods.updateStatus = async function (status, additionalData = {}) {
    const oldStatus = this.status;
    this.status = status;

    // Update additional fields if provided
    Object.assign(this, additionalData);

    await this.save();

    logger.info(`Deployment status updated`, {
        deploymentId: this._id,
        projectId: this.projectId,
        oldStatus,
        newStatus: status,
        ...additionalData
    });

    return this;
};

module.exports = mongoose.model('Deployment', DeploymentSchema);

/**
 * @fileoverview Deployment Controller
 * @description Handles deployment operations including creation, status updates, AI review integration,
 *              and deployment worker communication for the Shard platform
 *  @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require("axios");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const User = require("../models/User");
const logService = require("../services/logService");
const envService = require("../services/envService");
const logger = require("../utils/logger");

const AI_MODEL_COSTS = {
  'deepseek_lite': 10,
  'deepseek_full': 20,
  'codellama_lite': 25,
  'codellama_full': 30,
  'mistral_7b': 50,
  'falcon_7b': 100,
};

/**
 * Create a new deployment with AI review and worker queue integration
 * @async
 * @function createDeployment
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.projectId - Project ID to deploy
 * @param {string} [req.body.branch='main'] - Git branch to deploy
 * @param {string} [req.body.commitHash] - Specific commit hash to deploy
 * @param {string} [req.body.message] - Deployment message
 * @param {Array<Object>} [req.body.environmentVariables] - Additional environment variables
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with deployment info or error
 * @throws {ValidationError} When projectId is missing
 * @throws {NotFoundError} When project is not found or user lacks access
 * @throws {ConflictError} When another deployment is already in progress
 * @throws {ServerError} When AI review or deployment queuing fails
 * @note Performs AI code review before deployment and handles verdict-based flow control
 * @note Admin users can deploy any project, regular users only their own
 */
const createDeployment = async (req, res) => {
    const { projectId, branch = 'main', commitHash, message, environmentVariables = [], enableAiReview, aiModel } = req.body;

    // Debug: Log incoming request parameters
    logger.debug(`[DEBUG] Frontend Request - enableAiReview: ${enableAiReview}, aiModel: ${aiModel}, projectId: ${projectId}`);

    // Input validation
    if (!projectId) {
        return res.apiValidationError(
            { projectId: 'Project ID is required' },
            'Missing required fields'
        );
    }

    try {
        // Find project - admin can deploy any project, users only their own
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        // Token balance check for AI Review - use frontend parameter if provided, otherwise calculate from project settings
        const aiOptOut = project.aiOptOut || project.settings?.aiOptOut;
        const willPerformAiReview = enableAiReview !== undefined ? enableAiReview : !aiOptOut;
        
        logger.debug(`[DEBUG] AI Review Settings - frontend enableAiReview: ${enableAiReview}, project.aiOptOut: ${project.aiOptOut}, project.settings?.aiOptOut: ${project.settings?.aiOptOut}, final willPerformAiReview: ${willPerformAiReview}`);
        
        if (willPerformAiReview) {
            // Use default model if not provided
            const selectedAiModel = aiModel || 'deepseek_lite';
            
            if (!AI_MODEL_COSTS[selectedAiModel]) {
                return res.apiValidationError({ aiModel: 'A valid AI model is required for AI review.' });
            }

            const tokenCost = AI_MODEL_COSTS[selectedAiModel];
            const user = await User.findById(req.user._id);

            if (user.tokens < tokenCost) {
                return res.apiError(
                    'Insufficient tokens for AI review.',
                    402, // Payment Required
                    {
                        requiredTokens: tokenCost,
                        currentBalance: user.tokens,
                    },
                    'INSUFFICIENT_TOKENS'
                );
            }

            // Deduct tokens before proceeding
            user.tokens -= tokenCost;
            await user.save();
            logger.info(`Deducted ${tokenCost} tokens from user ${user.email} for AI review. New balance: ${user.tokens}`);
        }

        // Check for existing active deployments to prevent duplicates
        const activeStatuses = ['pending', 'reviewing', 'configuring', 'building', 'deploying', 'queued'];
        const existingActiveDeployment = await Deployment.findOne({
            projectId: project._id,
            status: { $in: activeStatuses }
        });

        if (existingActiveDeployment) {
            return res.apiError(
                `A deployment is already in progress for this project (Status: ${existingActiveDeployment.status})`,
                409, // Conflict status code
                {
                    existingDeploymentId: existingActiveDeployment._id,
                    existingStatus: existingActiveDeployment.status,
                    createdAt: existingActiveDeployment.createdAt
                },
                'DEPLOYMENT_IN_PROGRESS'
            );
        }

        // Mark old deployments as inactive
        await Deployment.updateMany(
            { projectId: project._id, status: { $in: ['success', 'running', 'active'] } },
            { status: 'inactive' }
        );

        // Create Deployment record with additional metadata
        const deployment = await Deployment.create({
            projectId: project._id,
            status: "pending",
            branch: branch,
            commitHash: commitHash || 'latest',
            commitMessage: message || `Deploy ${branch} branch`,
            userEmail: req.user.email,
            createdAt: new Date()
        });

        // Fetch actual env vars from database
        const envVars = await envService.getEnvVars(projectId);
        const envObject = {};
        envVars.forEach(env => {
            envObject[env.key] = env.value;
        });

        // Merge environment variables from request with stored ones
        const mergedEnvVars = { ...envObject };
        if (environmentVariables && environmentVariables.length > 0) {
            environmentVariables.forEach(env => {
                if (env.key && env.value) {
                    mergedEnvVars[env.key] = env.value;
                }
            });
        }

        // Prepare job object for worker queue
        const job = {
            projectId: project._id,
            deploymentId: deployment._id,
            repoUrl: project.repoUrl,
            stack: project.framework,
            subdomain: project.subdomain,
            branch: branch,
            commitHash: commitHash || 'latest',
            envVars: mergedEnvVars,
            userEmail: req.user.email,
            token: req.headers.authorization?.replace('Bearer ', '')
        };

        // Log deployment start
        await logService.addLog(projectId, deployment._id, "build", "Deployment started");

        // Add AI review settings to job for deployment worker to handle
        // Force explicit assignment to ensure properties exist in job object
        job.enableAiReview = Boolean(willPerformAiReview);
        job.aiModel = willPerformAiReview ? (aiModel || 'deepseek_lite') : 'deepseek_lite';
        
        console.log(`[DEBUG] Before sending - job keys:`, Object.keys(job));
        console.log(`[DEBUG] AI Review values - willPerformAiReview: ${willPerformAiReview}, job.enableAiReview: ${job.enableAiReview}, job.aiModel: ${job.aiModel}`);
        
        console.log(`[DEBUG] Backend sending to worker - willPerformAiReview: ${willPerformAiReview}, enableAiReview: ${job.enableAiReview}, aiModel: ${job.aiModel}`);
        console.log(`[DEBUG] Complete job object being sent:`, JSON.stringify(job, null, 2));
        
        // Add job to worker queue - AI review will happen after repo cloning
        try {
            console.log(`[DEBUG] Sending job to deployment worker at: ${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`);
            const workerResponse = await axios.post(`${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`, job, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`[DEBUG] Deployment worker response:`, workerResponse.status, workerResponse.data);

            await logService.addLog(projectId, deployment._id, "queue", "Job added to deployment queue");
        } catch (queueError) {
            console.error("Failed to queue deployment job:", queueError);

            // Update deployment status to failed
            deployment.status = "failed";
            deployment.finishedAt = new Date();
            await deployment.save();

            await logService.addLog(projectId, deployment._id, "error",
                `Failed to queue deployment: ${queueError.message}`);

            return res.apiServerError("Failed to queue deployment", queueError.message);
        }

        return res.apiCreated({
            _id: deployment._id,
            deploymentId: deployment._id,
            status: deployment.status,
            projectName: project.name,
            projectId: project._id
        }, "Deployment started successfully");
    } catch (err) {
        console.error("Deployment error:", err);
        return res.apiServerError("Deployment failed", err.message);
    }
};

/**
 * Get all deployments for the authenticated user with project information
 * @async
 * @function getDeployments
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with deployments array
 * @throws {ServerError} When database operations fail
 * @note Admin users see all deployments, regular users only their own project deployments
 * @note Results are sorted by creation date (newest first) and include project name/subdomain
 */
const getDeployments = async (req, res) => {
    try {
        // Admin can see all deployments, users only their own
        let query = {};
        if (req.user.role !== 'admin') {
            try {
                // Get user's projects first
                const userProjects = await Project.find({ ownerId: req.user._id }).select('_id');
                const projectIds = userProjects.map(p => p._id);
                query = { projectId: { $in: projectIds } };
            } catch (projectErr) {
                logger.error("Error fetching user projects:", projectErr);
                return res.apiServerError("Error fetching user projects", projectErr.message);
            }
        }

        const deployments = await Deployment.find(query)
            .populate("projectId", "name subdomain")
            .sort({ createdAt: -1 });

        logger.info(`Fetched ${deployments.length} deployments for user ${req.user._id}`);
        return res.apiSuccess(deployments, "Deployments fetched successfully");
    } catch (err) {
        logger.error("Error fetching deployments:", {
            error: err.message,
            stack: err.stack,
            userId: req.user._id,
            userRole: req.user.role
        });
        return res.apiServerError("Error fetching deployments", err.message);
    }
};

/**
 * Update deployment step and log progress (used by deployment worker)
 * @async
 * @function updateDeploymentStep
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.deploymentId - Deployment ID to update
 * @param {string} req.body.step - Current deployment step (build, deploy, etc.)
 * @param {string} [req.body.message] - Step message to log
 * @param {string} [req.body.status] - New deployment status
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated deployment info
 * @throws {ValidationError} When required fields are missing
 * @throws {NotFoundError} When deployment is not found
 * @throws {ServerError} When database operations fail
 * @note Used by deployment worker to provide real-time progress updates
 */
const updateDeploymentStep = async (req, res) => {
    const { deploymentId, step, message, status } = req.body;

    // Input validation
    if (!deploymentId || !step) {
        return res.apiValidationError(
            {
                deploymentId: !deploymentId ? 'Deployment ID is required' : null,
                step: !step ? 'Step is required' : null
            },
            'Missing required fields'
        );
    }

    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.apiNotFound('Deployment');
        }

        // Update deployment status if provided
        if (status && status !== deployment.status) {
            deployment.status = status;
            await deployment.save();
        }

        // Log the step update
        await logService.addLog(deployment.projectId, deploymentId, step, message || `Step ${step} completed`);

        return res.apiSuccess({
            deploymentId: deployment._id,
            status: deployment.status,
            step: step
        }, 'Deployment step updated successfully');
    } catch (err) {
        console.error("Error updating deployment step:", err);
        return res.apiServerError("Failed to update deployment step", err.message);
    }
};

/**
 * Update deployment final status (success/failed) and set completion time
 * @async
 * @function updateDeploymentStatus
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.deploymentId - Deployment ID to update
 * @param {string} req.body.status - Final deployment status (success, failed, etc.)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated deployment
 * @throws {NotFoundError} When deployment is not found
 * @throws {ServerError} When database operations fail
 * @note Automatically sets finishedAt timestamp for terminal statuses (success/failed)
 */
const updateDeploymentStatus = async (req, res) => {
    const { deploymentId, status } = req.body;

    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.apiNotFound("Deployment");
        }

        deployment.status = status;
        if (status === "success" || status === "failed") {
            deployment.finishedAt = new Date();
        }

        await deployment.save();

        // Log deployment completion status
        await logService.addLog(deployment.projectId, deploymentId, "build", `Deployment ${status}`);

        return res.apiSuccess({ deployment }, "Deployment status updated successfully");
    } catch (err) {
        console.error("Deployment status update failed:", err);
        return res.apiServerError("Failed to update deployment status", err.message);
    }
};

/**
 * Create deployment from project import (internal helper function)
 * @async
 * @function createDeploymentFromProject
 * @param {Object} params - Deployment parameters
 * @param {string} params.projectId - Project ID to deploy
 * @param {string} params.userId - User ID triggering deployment
 * @param {string} [params.branch='main'] - Git branch to deploy
 * @param {string} [params.commitHash='HEAD'] - Commit hash to deploy
 * @param {string} [params.message] - Deployment message
 * @param {Array<Object>} [params.envVars] - Environment variables array
 * @returns {Promise<Object>} Deployment result object with success status
 * @throws {Error} When project is not found or deployment queuing fails
 * @note Used internally for automated deployments during project import
 * @note Bypasses AI review process for imported projects
 */
const createDeploymentFromProject = async ({
    projectId,
    userId,
    branch = 'main',
    commitHash = 'HEAD',
    message = 'Deployment from project import',
    envVars = []
}) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Create deployment record
        const deployment = new Deployment({
            projectId,
            userId,
            branch,
            commitHash,
            message,
            status: 'pending',
            userEmail: 'user@example.com', // Should get from user model
            envVars: envVars.map(({ key, value, isSecret = false }) => ({
                key,
                value: isSecret ? Buffer.from(value).toString('base64') : value,
                isSecret
            }))
        });

        await deployment.save();

        // Queue deployment job
        const jobData = {
            deploymentId: deployment._id,
            projectId: project._id,
            repoUrl: project.repoUrl,
            branch,
            stack: project.framework,
            subdomain: project.subdomain,
            userEmail: req.user.email,
            token: req.headers.authorization?.replace('Bearer ', ''),
            envVars: [...(project.settings.envVars || []), ...envVars],
            buildCommand: project.settings.buildCommand,
            startCommand: project.settings.startCommand,
            metadata: project.metadata
        };

        // Send to deployment worker
        try {
            const response = await axios.post(
                `${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`,
                jobData,
                { timeout: 10000 }
            );

            if (response.data.success) {
                deployment.status = 'queued';
                await deployment.save();
                logger.info(`Deployment ${deployment._id} queued successfully`);
            }
        } catch (queueError) {
            logger.error('Failed to queue deployment job:', queueError.message);
            deployment.status = 'failed';
            deployment.error = `Failed to queue deployment: ${queueError.message}`;
            await deployment.save();
        }

        return {
            success: true,
            deploymentId: deployment._id,
            status: deployment.status
        };

    } catch (error) {
        logger.error('Failed to create deployment from project:', error);
        throw error;
    }
};

/**
 * Delete a deployment and its associated logs
 * @async
 * @function deleteDeployment
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Deployment ID to delete
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 * @throws {NotFoundError} When deployment is not found
 * @throws {ForbiddenError} When user lacks permission to delete deployment
 * @throws {ServerError} When database operations fail
 * @note Only project owners can delete their deployments
 * @note Performs cascade deletion of associated logs
 */
const deleteDeployment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the deployment and check ownership
        const deployment = await Deployment.findById(id).populate('projectId');
        if (!deployment) {
            return res.apiNotFound('Deployment');
        }

        // Check if user owns the project (and thus the deployment)
        if (deployment.projectId.ownerId.toString() !== userId) {
            return res.apiForbidden('You do not have permission to delete this deployment');
        }

        // Delete associated logs
        await logService.deleteLogsByDeployment(id);

        // Delete the deployment
        await Deployment.findByIdAndDelete(id);

        logger.info(`Deployment ${id} deleted by user ${userId}`);

        return res.apiSuccess(null, 'Deployment deleted successfully');
    } catch (error) {
        logger.error(`Error deleting deployment: ${error.message}`, { error });
        return res.apiError('Failed to delete deployment', error);
    }
};

/**
 * Redeploy an existing deployment with same configuration
 * @async
 * @function redeployDeployment
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Existing deployment ID to redeploy
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with new deployment info
 * @throws {NotFoundError} When original deployment is not found
 * @throws {ForbiddenError} When user lacks permission to redeploy
 * @throws {ConflictError} When another deployment is already in progress
 * @throws {ServerError} When deployment queuing fails
 * @note Creates new deployment record with same branch/commit as original
 * @note Bypasses AI review process for redeployments
 * @note Admin users can redeploy any deployment, regular users only their own
 */
const redeployDeployment = async (req, res) => {
    try {
        const { id } = req.params; // This is the deployment ID to redeploy

        // Find the existing deployment
        const existingDeployment = await Deployment.findById(id).populate('projectId');
        if (!existingDeployment) {
            return res.apiNotFound('Deployment not found');
        }

        const project = existingDeployment.projectId;

        // Check ownership
        if (project.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.apiForbidden('You do not have permission to redeploy this project');
        }

        // Check for existing active deployments to prevent duplicates
        const activeStatuses = ['pending', 'reviewing', 'configuring', 'building', 'deploying', 'queued'];
        const existingActiveDeployment = await Deployment.findOne({
            projectId: project._id,
            status: { $in: activeStatuses }
        });

        if (existingActiveDeployment) {
            return res.apiError(
                `A deployment is already in progress for this project (Status: ${existingActiveDeployment.status})`,
                409, // Conflict status code
                {
                    existingDeploymentId: existingActiveDeployment._id,
                    existingStatus: existingActiveDeployment.status,
                    createdAt: existingActiveDeployment.createdAt
                },
                'DEPLOYMENT_IN_PROGRESS'
            );
        }

        // Create a new deployment record for the redeployment
        const newDeployment = await Deployment.create({
            projectId: project._id,
            status: "pending",
            branch: existingDeployment.branch,
            commitHash: existingDeployment.commitHash,
            commitMessage: `Redeploy of ${existingDeployment.commitHash.substring(0, 7)}`,
            userEmail: req.user.email,
            createdAt: new Date()
        });

        // Fetch env vars
        const envVars = await envService.getEnvVars(project._id);
        const envObject = {};
        envVars.forEach(env => {
            envObject[env.key] = env.value;
        });

        // Prepare job for deployment worker
        const job = {
            projectId: project._id,
            deploymentId: newDeployment._id,
            repoUrl: project.repoUrl,
            stack: project.framework,
            subdomain: project.subdomain,
            branch: newDeployment.branch,
            commitHash: newDeployment.commitHash,
            envVars: envObject,
            userEmail: req.user.email,
            token: req.headers.authorization?.replace('Bearer ', '')
        };

        // Log and queue the job
        await logService.addLog(project._id, newDeployment._id, "build", "Redeployment started");

        // No AI review on redeploy, just queue it
        await axios.post(`${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`, job, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        await logService.addLog(project._id, newDeployment._id, "queue", "Redeployment job queued");

        // Update the new deployment status to 'queued'
        newDeployment.status = 'queued';
        await newDeployment.save();

        logger.info(`Redeployment triggered for project ${project._id} by user ${req.user.email}`);

        return res.apiCreated({
            _id: newDeployment._id,
            deploymentId: newDeployment._id,
            status: newDeployment.status,
            projectId: project._id
        }, "Redeployment started successfully");

    } catch (error) {
        logger.error(`Error triggering redeployment: ${error.message}`, { error });
        return res.apiServerError('Failed to trigger redeployment', error.message);
    }
};

/**
 * Override AI review manual_review status and continue deployment
 * @async
 * @function overrideAiReview
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.deploymentId - Deployment ID to override
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with override confirmation
 * @throws {NotFoundError} When deployment is not found
 * @throws {ValidationError} When deployment is not in manual_review status
 * @throws {ServerError} When override operation fails
 * @description Allows user to override AI review manual_review verdict and continue deployment
 * @note Only works for deployments in manual_review status
 */
const overrideAiReview = async (req, res) => {
    try {
        const { deploymentId } = req.params;
        
        // Find the deployment
        const deployment = await Deployment.findById(deploymentId).populate('projectId');
        if (!deployment) {
            return res.apiNotFound("Deployment not found");
        }
        
        // Check if deployment belongs to user (unless admin)
        if (req.user.role !== 'admin' && deployment.projectId.ownerId.toString() !== req.user._id.toString()) {
            return res.apiForbidden("Access denied");
        }
        
        // Check if deployment is in manual_review status
        if (deployment.status !== 'manual_review') {
            return res.apiBadRequest("Deployment is not in manual_review status");
        }
        
        // Get project details for continuation
        const project = deployment.projectId;
        
        // Get environment variables
        const envVars = await EnvVar.find({ projectId: project._id });
        
        // Prepare continuation job object
        const continuationJob = {
            token: req.headers.authorization?.replace('Bearer ', ''),
            deploymentId: deployment._id,
            projectId: project._id,
            repoUrl: project.repoUrl,
            branch: deployment.branch || 'main',
            stack: project.framework,
            subdomain: project.subdomain,
            envVars: envVars.map(env => ({ key: env.key, value: env.value })),
            userEmail: req.user.email
        };
        
        // Call deployment worker continuation endpoint
        const workerResponse = await axios.post(
            `${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/continue/${deploymentId}`,
            continuationJob,
            {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        // Update deployment status to indicate override
        deployment.status = 'deploying';
        deployment.aiReviewOverridden = true;
        deployment.aiReviewOverriddenAt = new Date();
        deployment.aiReviewOverriddenBy = req.user._id;
        await deployment.save();
        
        // Log the override action
        await logService.addLog(project._id, deployment._id, "ai-review", "AI review overridden by user - continuing deployment");
        
        logger.info(`AI review overridden for deployment ${deploymentId} by user ${req.user.email}`);
        
        return res.apiSuccess({
            deploymentId: deployment._id,
            status: deployment.status,
            message: "AI review overridden successfully, deployment continuing"
        }, "AI review override successful");
        
    } catch (error) {
        logger.error(`Error overriding AI review: ${error.message}`, { error });
        return res.apiServerError('Failed to override AI review', error.message);
    }
};

/**
 * Export deployment controller functions
 * @module deployController
 * @description Provides comprehensive deployment management including creation, monitoring,
 *              AI review integration, and worker communication for the Shard platform
 */
module.exports = {
    createDeployment,
    createDeploymentFromProject,
    getDeployments,
    updateDeploymentStep,
    updateDeploymentStatus,
    deleteDeployment,
    redeployDeployment,
    overrideAiReview,
};

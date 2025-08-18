const axios = require("axios");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const logService = require("../services/logService");
const envService = require("../services/envService");
const logger = require("../utils/logger");

const createDeployment = async (req, res) => {
    const { projectId, branch = 'main', commitHash, message, environmentVariables = [] } = req.body;

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

        // Step 1: AI Review Process
        await logService.addLog(projectId, deployment._id, "ai-review", "Starting AI code review");

        try {
            const aiReviewResponse = await axios.post(
                `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/review/`,
                { projectId: project._id.toString() },
                { timeout: 60000 } // 1 minute timeout for AI review
            );

            const { verdict, issueCount, issues } = aiReviewResponse.data;

            // Log AI review results
            await logService.addLog(projectId, deployment._id, "ai-review",
                `AI review completed: ${verdict} (${issueCount} issues found)`);

            // Handle AI review verdict
            if (verdict === "deny") {
                deployment.status = "failed";
                deployment.finishedAt = new Date();
                await deployment.save();

                await logService.addLog(projectId, deployment._id, "ai-review",
                    "Deployment blocked by AI review due to critical issues");

                return res.apiError("Deployment blocked by AI review", 400, {
                    verdict,
                    issueCount,
                    issues: issues.slice(0, 5)
                }, 'AI_REVIEW_BLOCKED');
            }

            if (verdict === "manual_review") {
                deployment.status = "pending_review";
                await deployment.save();

                await logService.addLog(projectId, deployment._id, "ai-review",
                    "Deployment requires manual review");

                return res.apiSuccess({
                    verdict,
                    issueCount,
                    issues: issues.slice(0, 5),
                    deploymentId: deployment._id
                }, "Deployment requires manual review", 202);
            }

            // If verdict is "allow", proceed with deployment
            await logService.addLog(projectId, deployment._id, "ai-review",
                "AI review passed, proceeding with deployment");

        } catch (aiError) {
            console.error("AI review failed:", aiError);
            await logService.addLog(projectId, deployment._id, "ai-review",
                `AI review failed: ${aiError.message}`);

            // Continue with deployment even if AI review fails (fallback)
            await logService.addLog(projectId, deployment._id, "ai-review",
                "Proceeding with deployment despite AI review failure");
        }

        // Step 2: Add job to worker queue (only if AI review passed or failed)
        try {
            await axios.post(`${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/deploy/job`, job, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
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

// New method for creating deployment from GitHub project import
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

// Delete deployment
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

// Redeploy a previous deployment
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

module.exports = {
    createDeployment,
    createDeploymentFromProject,
    getDeployments,
    updateDeploymentStep,
    updateDeploymentStatus,
    deleteDeployment,
    redeployDeployment,
};

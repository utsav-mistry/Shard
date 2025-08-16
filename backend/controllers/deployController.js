const axios = require("axios");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const logService = require("../services/logService");
const envService = require("../services/envService");

const createDeployment = async (req, res) => {
    const { projectId } = req.body;

    try {
        // Find project - admin can deploy any project, users only their own
        const query = req.user.role === 'admin'
            ? { _id: projectId }
            : { _id: projectId, ownerId: req.user._id };

        const project = await Project.findOne(query);
        if (!project) {
            return res.apiNotFound('Project');
        }

        // Create Deployment record
        const deployment = await Deployment.create({
            projectId: project._id,
            status: "pending",
        });

        // Fetch actual env vars from database
        const envVars = await envService.getEnvVars(projectId);
        const envObject = {};
        envVars.forEach(env => {
            envObject[env.key] = env.value;
        });

        // Prepare job object for worker queue
        const job = {
            projectId: project._id,
            repoUrl: project.repoUrl,
            stack: project.stack,
            subdomain: project.subdomain,
            envVars: envObject,  // Now using actual env vars
            userEmail: req.user.email,
            deploymentId: deployment._id  // Pass deployment ID for logs
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
        await axios.post(`${process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000'}/api/jobs`, job);

        return res.apiCreated({ deploymentId: deployment._id }, "Deployment started successfully");
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
            // Get user's projects first
            const userProjects = await Project.find({ ownerId: req.user._id }).select('_id');
            const projectIds = userProjects.map(p => p._id);
            query = { projectId: { $in: projectIds } };
        }

        const deployments = await Deployment.find(query)
            .populate("projectId", "name subdomain")
            .sort({ createdAt: -1 });

        return res.apiSuccess(deployments, "Deployments fetched successfully");
    } catch (err) {
        console.error("Error fetching deployments:", err);
        return res.apiServerError("Error fetching deployments", err.message);
    }
};

const updateDeploymentStep = async (req, res) => {
    const { deploymentId, step, message } = req.body;

    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        // Log the step update
        await logService.addLog(deployment.projectId, deploymentId, step, message);

        return res.json({
            success: true,
            message: 'Deployment step updated successfully'
        });
    } catch (err) {
        console.error('Error updating deployment step:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update deployment step',
            error: err.message
        });
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

module.exports = { createDeployment, getDeployments, updateDeploymentStatus, updateDeploymentStep };

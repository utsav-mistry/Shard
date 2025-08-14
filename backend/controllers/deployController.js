const axios = require("axios");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const logService = require("../services/logService"); 
const envService = require("../services/envService"); 

const createDeployment = async (req, res) => {
    const { projectId } = req.body;

    try {
        // Find project
        const project = await Project.findById(projectId);
        if (!project || project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Project not found" });
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
                
                return res.status(400).json({ 
                    message: "Deployment blocked by AI review",
                    verdict,
                    issueCount,
                    issues: issues.slice(0, 5) // Return first 5 issues
                });
            }

            if (verdict === "manual_review") {
                deployment.status = "pending_review";
                await deployment.save();
                
                await logService.addLog(projectId, deployment._id, "ai-review", 
                    "Deployment requires manual review");
                
                return res.status(202).json({ 
                    message: "Deployment requires manual review",
                    verdict,
                    issueCount,
                    issues: issues.slice(0, 5),
                    deploymentId: deployment._id
                });
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

        res.status(201).json({ deploymentId: deployment._id });
    } catch (err) {
        console.error("Deployment error:", err);
        res.status(500).json({ message: "Deployment failed" });
    }
};

const getDeployments = async (req, res) => {
    try {
        const deployments = await Deployment.find().populate("projectId");
        res.json(deployments);
    } catch (err) {
        res.status(500).json({ message: "Error fetching deployments" });
    }
};

const updateDeploymentStatus = async (req, res) => {
    const { deploymentId, status } = req.body;

    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.status(404).json({ message: "Deployment not found" });
        }

        deployment.status = status;
        if (status === "success" || status === "failed") {
            deployment.finishedAt = new Date();
        }

        await deployment.save();

        // Log deployment completion status
        await logService.addLog(deployment.projectId, deploymentId, "build", `Deployment ${status}`);

        res.status(200).json({ message: "Deployment status updated" });
    } catch (err) {
        console.error("Deployment status update failed:", err);
        res.status(500).json({ message: "Failed to update deployment status" });
    }
};

module.exports = { createDeployment, getDeployments, updateDeploymentStatus };

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

        // Add job to worker queue
        await axios.post("http://localhost:9000/queue", job);

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

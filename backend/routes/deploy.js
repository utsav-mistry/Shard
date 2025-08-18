const express = require("express");
const { createDeployment, getDeployments, updateDeploymentStatus, updateDeploymentStep, deleteDeployment, redeployDeployment } = require("../controllers/deployController");
const { authenticate } = require("../middleware/auth");
const { validateDeployment, sanitizeBody } = require("../utils/validation");

const router = express.Router();

// Use authenticate as protect for consistency
const protect = authenticate;

router.post("/", protect, sanitizeBody, validateDeployment, createDeployment);

router.get("/", protect, getDeployments);

router.get("/:id", protect, async (req, res) => {
  try {
    const Deployment = require("../models/Deployment");
    const deployment = await Deployment.findById(req.params.id).populate("projectId", "name subdomain");
    if (!deployment) {
      return res.apiNotFound("Deployment");
    }
    return res.apiSuccess(deployment, "Deployment fetched successfully");
  } catch (err) {
    return res.apiServerError("Error fetching deployment", err.message);
  }
});

router.post("/update-status", protect, updateDeploymentStatus);
router.post("/update-step", protect, updateDeploymentStep);

// Delete deployment
router.delete("/:id", protect, deleteDeployment);

// Redeploy a previous deployment
router.post("/:id/redeploy", protect, redeployDeployment);

// Update deployment with AI review results
router.post('/ai-results', protect, async (req, res) => {
    try {
        const { deploymentId, aiReviewResults } = req.body;

        if (!deploymentId || !aiReviewResults) {
            return res.status(400).json({
                success: false,
                message: 'Deployment ID and AI review results are required'
            });
        }

        const Deployment = require('../models/Deployment');
        const deployment = await Deployment.findByIdAndUpdate(
            deploymentId,
            { aiReviewResults },
            { new: true }
        );

        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        res.json({
            success: true,
            message: 'AI review results updated successfully',
            data: deployment
        });

    } catch (error) {
        console.error('Error updating AI review results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update AI review results'
        });
    }
});

// Update deployment with commit information
router.patch('/:deploymentId', protect, async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { commitHash, commitMessage, author, commitDate } = req.body;

        const Deployment = require('../models/Deployment');
        const deployment = await Deployment.findByIdAndUpdate(
            deploymentId,
            { 
                commitHash,
                commitMessage,
                'metadata.author': author,
                'metadata.commitDate': commitDate
            },
            { new: true }
        );

        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        res.json({
            success: true,
            message: 'Deployment updated successfully',
            data: deployment
        });

    } catch (error) {
        console.error('Error updating deployment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deployment'
        });
    }
});

module.exports = router;

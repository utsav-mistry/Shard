const express = require('express');
const router = express.Router();
const jobProcessor = require('../services/jobProcessor');
const { cleanupProjectContainers } = require('../utils/dockerHelpers');
const logger = require('../utils/logger');

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Deployment worker is running',
        timestamp: new Date().toISOString()
    });
});

// Process deployment job
router.post('/job', async (req, res) => {
        const { deploymentId, projectId, repoUrl, branch, stack, subdomain, envVars, userEmail, token } = req.body;

    // Validate required fields
    if (!deploymentId || !projectId || !repoUrl || !stack || !subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: deploymentId, projectId, repoUrl, stack, subdomain'
        });
    }

    try {
        logger.info(`Received deployment job for project ${projectId}`);
        
        // Process the job asynchronously
        jobProcessor.processJob({
            token,
            deploymentId,
            projectId,
            repoUrl,
            branch: branch || 'main',
            stack,
            subdomain,
            envVars: envVars || [],
            userEmail
        });

        res.json({
            success: true,
            message: 'Deployment job queued successfully',
            deploymentId
        });
    } catch (error) {
        logger.error('Failed to queue deployment job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue deployment job',
            error: error.message
        });
    }
});

// Cleanup project Docker resources
router.delete('/cleanup/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { subdomain } = req.body;

    // Validate required fields
    if (!projectId || !subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: projectId and subdomain'
        });
    }

    try {
        logger.info(`Received cleanup request for project ${projectId} with subdomain ${subdomain}`);
        
        const result = await cleanupProjectContainers(projectId, subdomain);
        
        res.json({
            success: true,
            message: 'Docker resources cleaned up successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Failed to cleanup Docker resources for project ${projectId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup Docker resources',
            error: error.message
        });
    }
});

// Update deployment status
router.put('/status/:deploymentId', async (req, res) => {
    const { deploymentId } = req.params;
    const { status, message, logs } = req.body;

    try {
        logger.info(`Updating deployment status for ${deploymentId}: ${status}`);
        
        // Here you would typically update the deployment status in your database
        // For now, we'll just log it
        
        res.json({
            success: true,
            message: 'Deployment status updated successfully'
        });
    } catch (error) {
        logger.error('Failed to update deployment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deployment status',
            error: error.message
        });
    }
});

module.exports = router;

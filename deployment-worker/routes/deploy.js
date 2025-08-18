const express = require('express');
const { processJob } = require('../services/jobProcessor.js');
const logger = require('../utils/logger.js');

const router = express.Router();

/**
 * POST /api/deploy
 * Handle deployment requests from backend
 */
router.post('/', async (req, res) => {
    try {
        const {
            deploymentId,
            projectId,
            repoUrl,
            branch,
            stack,
            subdomain,
            userEmail,
            token,
            envVars,
            buildCommand,
            startCommand,
            metadata
        } = req.body;

        // Validate required fields
        if (!deploymentId || !projectId || !repoUrl || !stack || !subdomain || !token) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: deploymentId, projectId, repoUrl, stack, subdomain, token'
            });
        }

        logger.info(`Received deployment request for project ${projectId}, deployment ${deploymentId}`);

        // Process deployment job asynchronously
        processJob({
            deploymentId,
            projectId,
            repoUrl,
            branch: branch || 'main',
            stack,
            subdomain,
            userEmail: userEmail || 'user@example.com',
            token,
            envVars: envVars || {},
            buildCommand: buildCommand || 'npm install && npm run build',
            startCommand: startCommand || 'npm start',
            metadata: metadata || {}
        }).catch(error => {
            logger.error(`Deployment job failed for ${deploymentId}:`, error);
        });

        res.json({
            success: true,
            message: 'Deployment job queued successfully',
            deploymentId,
            status: 'queued'
        });

    } catch (error) {
        logger.error('Deployment API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue deployment',
            error: error.message
        });
    }
});

/**
 * POST /api/deploy/status
 * Update deployment status
 */
router.post('/status', async (req, res) => {
    try {
        const { deploymentId, status, message } = req.body;

        if (!deploymentId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: deploymentId, status'
            });
        }

        logger.info(`Status update for deployment ${deploymentId}: ${status}`);

        // Here you would typically update the deployment status in your database
        // For now, we'll just log it and return success

        res.json({
            success: true,
            message: 'Status updated successfully'
        });

    } catch (error) {
        logger.error('Status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

module.exports = router;

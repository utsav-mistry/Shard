/**
 * @fileoverview Deployment Routes
 * @description Express routes for deployment job processing, cleanup, and status management
 *              in the deployment worker service
 * @author Utsav Mistry
 * @version 0.2.3
 */

const express = require('express');
const router = express.Router();
const jobProcessor = require('../services/jobProcessor');
const { cleanupProjectContainers } = require('../utils/dockerHelpers');
const logger = require('../utils/logger');

/**
 * Health check endpoint for deployment service
 * @route GET /
 * @returns {Object} Service status and timestamp
 * @description Basic health check to verify deployment worker is running
 */
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Deployment worker is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Process new deployment job
 * @route POST /job
 * @param {Object} req.body - Deployment job parameters
 * @param {string} req.body.deploymentId - Unique deployment identifier
 * @param {string} req.body.projectId - Project identifier
 * @param {string} req.body.repoUrl - Repository URL to deploy
 * @param {string} [req.body.branch='main'] - Git branch to deploy
 * @param {string} req.body.stack - Technology stack (mern, flask, django)
 * @param {string} req.body.subdomain - Project subdomain
 * @param {Array<Object>} [req.body.envVars=[]] - Environment variables
 * @param {string} req.body.userEmail - User email for notifications
 * @param {string} req.body.token - Authentication token
 * @returns {Object} Job queue confirmation or error
 * @throws {ValidationError} When required fields are missing
 * @throws {ServerError} When job processing fails
 * @description Queues deployment job for asynchronous processing
 * @note Job is processed asynchronously to avoid request timeout
 */
router.post('/job', async (req, res) => {
    try {
        const job = req.body;
        console.log(`[DEBUG] Deployment worker received job:`, JSON.stringify(job, null, 2));
        logger.info(`Received deployment job for project ${job.projectId}`);
        
        // Validate required fields
        if (!job.deploymentId || !job.projectId || !job.repoUrl || !job.stack || !job.subdomain) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: deploymentId, projectId, repoUrl, stack, subdomain'
            });
        }

        // Process the job asynchronously
        jobProcessor.processJob({
            token: job.token,
            deploymentId: job.deploymentId,
            projectId: job.projectId,
            repoUrl: job.repoUrl,
            branch: job.branch || 'main',
            stack: job.stack,
            subdomain: job.subdomain,
            envVars: job.envVars || [],
            userEmail: job.userEmail,
            enableAiReview: job.enableAiReview,
            aiModel: job.aiModel
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

/**
 * Cleanup Docker resources for a project
 * @route DELETE /cleanup/:projectId
 * @param {string} req.params.projectId - Project ID to cleanup
 * @param {string} req.body.subdomain - Project subdomain for container identification
 * @returns {Object} Cleanup result or error
 * @throws {ValidationError} When projectId or subdomain is missing
 * @throws {ServerError} When Docker cleanup fails
 * @description Removes Docker containers, images, and networks for a project
 * @note Used when projects are deleted or need resource cleanup
 */
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

/**
 * Update deployment status and logs
 * @route PUT /status/:deploymentId
 * @param {string} req.params.deploymentId - Deployment ID to update
 * @param {string} req.body.status - New deployment status
 * @param {string} [req.body.message] - Status message
 * @param {Array<string>} [req.body.logs] - Deployment logs
 * @returns {Object} Update confirmation or error
 * @throws {ServerError} When status update fails
 * @description Updates deployment status in database and logs progress
 * @note Called by job processor to report deployment progress
 */
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

/**
 * Continue deployment after manual AI review override
 * @route POST /continue/:deploymentId
 * @param {string} req.params.deploymentId - Deployment ID to continue
 * @param {Object} req.body - Job continuation parameters
 * @param {string} req.body.token - Authentication token
 * @returns {Object} Continuation confirmation or error
 * @throws {ValidationError} When required fields are missing
 * @throws {ServerError} When job continuation fails
 * @description Resumes deployment from AI review step after manual override
 * @note Called by backend when user clicks "Override & Deploy"
 */
router.post('/continue/:deploymentId', async (req, res) => {
    const { deploymentId } = req.params;
    const { token, projectId, repoUrl, branch, stack, subdomain, envVars, userEmail } = req.body;

    try {
        logger.info(`Received continuation request for deployment ${deploymentId}`);
        
        // Validate required fields
        if (!deploymentId || !token || !projectId || !repoUrl || !stack || !subdomain) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields for deployment continuation'
            });
        }

        // Continue the job from AI review step (skip AI review)
        jobProcessor.continueJob({
            token,
            deploymentId,
            projectId,
            repoUrl,
            branch: branch || 'main',
            stack,
            subdomain,
            envVars: envVars || [],
            userEmail,
            skipAiReview: true
        });

        res.json({
            success: true,
            message: 'Deployment continuation queued successfully',
            deploymentId
        });
    } catch (error) {
        logger.error('Failed to continue deployment job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to continue deployment job',
            error: error.message
        });
    }
});

/**
 * Export deployment routes
 * @module deployRoutes
 * @description Express router for deployment job management and Docker cleanup
 */
module.exports = router;

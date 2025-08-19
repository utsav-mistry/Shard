/**
 * @fileoverview Notification Controller
 * @description Handles email notifications for deployment events, user registration,
 *              and system communications for the Shard platform
 * @author Utsav Mistry
 * @version 1.0.0
 */

const emailService = require('../services/emailService');
const User = require('../models/User');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const logger = require('../utils/logger');

/**
 * Send deployment status notification email to user
 * @async
 * @function sendDeploymentNotification
 * @param {Object} req - Express request object
 * @param {string} req.body.email - Recipient email address
 * @param {string} req.body.projectId - MongoDB ObjectId of the project
 * @param {string} req.body.deploymentId - MongoDB ObjectId of the deployment
 * @param {string} req.body.status - Deployment status (started, running, success, completed, failed, error)
 * @param {string} [req.body.errorMessage] - Error message for failed deployments
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns success/failure response
 * @throws {ValidationError} When required fields are missing
 * @throws {NotFoundError} When project or deployment not found
 * @throws {ServerError} When email sending fails
 * @description Sends appropriate email based on deployment status
 * @note Supports multiple status types with different email templates
 * @note Includes project URL for successful deployments
 * @note Called by deployment worker to notify users of status changes
 * @example
 * // POST /api/notifications/deployment
 * // Body: { email: "user@example.com", projectId: "...", deploymentId: "...", status: "success" }
 */
const sendDeploymentNotification = async (req, res) => {
    try {
        const { email, projectId, deploymentId, status, errorMessage } = req.body;

        if (!email || !projectId || !deploymentId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, projectId, deploymentId, status'
            });
        }

        // Get project details
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Get deployment details
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        let emailSent = false;
        const customUrl = project.url; // Uses the virtual URL from Project model

        switch (status.toLowerCase()) {
            case 'started':
            case 'running':
                emailSent = await emailService.sendDeploymentStarted(
                    email,
                    project.name,
                    deploymentId
                );
                break;

            case 'success':
            case 'completed':
                emailSent = await emailService.sendDeploymentSuccess(
                    email,
                    project.name,
                    deploymentId,
                    customUrl
                );
                break;

            case 'failed':
            case 'error':
                emailSent = await emailService.sendDeploymentFailed(
                    email,
                    project.name,
                    deploymentId,
                    errorMessage
                );
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid status: ${status}. Valid statuses: started, running, success, completed, failed, error`
                });
        }

        if (emailSent) {
            logger.info(`Deployment notification sent to ${email} for project ${projectId} [${status}]`);
            res.json({
                success: true,
                message: 'Notification sent successfully'
            });
        } else {
            logger.error(`Failed to send deployment notification to ${email} for project ${projectId} [${status}]`);
            res.status(500).json({
                success: false,
                message: 'Failed to send notification'
            });
        }

    } catch (error) {
        logger.error('Error sending deployment notification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Send welcome email to newly registered user
 * @async
 * @function sendWelcomeEmail
 * @param {Object} req - Express request object
 * @param {string} req.body.email - New user's email address
 * @param {string} req.body.userName - New user's display name
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns success/failure response
 * @throws {ValidationError} When email or userName is missing
 * @throws {ServerError} When email sending fails
 * @description Sends welcome email with platform introduction and getting started guide
 * @note Called during user registration process
 * @note Includes platform features and next steps for new users
 * @note Non-blocking operation - registration succeeds even if email fails
 * @example
 * // POST /api/notifications/welcome
 * // Body: { email: "newuser@example.com", userName: "John Doe" }
 */
const sendWelcomeEmail = async (req, res) => {
    try {
        const { email, userName } = req.body;

        if (!email || !userName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, userName'
            });
        }

        const emailSent = await emailService.sendWelcomeEmail(email, userName);

        if (emailSent) {
            logger.info(`Welcome email sent to ${email}`);
            res.json({
                success: true,
                message: 'Welcome email sent successfully'
            });
        } else {
            logger.error(`Failed to send welcome email to ${email}`);
            res.status(500).json({
                success: false,
                message: 'Failed to send welcome email'
            });
        }

    } catch (error) {
        logger.error('Error sending welcome email:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Test email service configuration and connectivity
 * @async
 * @function testEmailConfig
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns email service status
 * @throws {ServerError} When email service configuration is invalid
 * @description Verifies SMTP connection and email service configuration
 * @note Used for system health checks and troubleshooting
 * @note Tests actual SMTP connection without sending emails
 * @note Helps administrators verify email setup during deployment
 * @example
 * // GET /api/notifications/test-config
 * // Returns: { success: true, message: "Email service is configured correctly" }
 */
const testEmailConfig = async (req, res) => {
    try {
        const isConnected = await emailService.verifyConnection();

        if (isConnected) {
            res.json({
                success: true,
                message: 'Email service is configured correctly'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Email service configuration failed'
            });
        }

    } catch (error) {
        logger.error('Error testing email configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Export notification controller functions
 * @module notificationController
 * @description Provides email notification services for deployment events and user communications
 */
module.exports = {
    sendDeploymentNotification,
    sendWelcomeEmail,
    testEmailConfig
};

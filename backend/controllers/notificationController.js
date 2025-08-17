const emailService = require('../services/emailService');
const User = require('../models/User');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const logger = require('../utils/logger');

// Send deployment notification
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

// Send welcome email
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

// Test email configuration
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

module.exports = {
    sendDeploymentNotification,
    sendWelcomeEmail,
    testEmailConfig
};

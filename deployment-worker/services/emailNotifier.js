/**
 * @fileoverview Email Notification Service
 * @description Service for sending deployment status notifications via email
 * @author Utsav Mistry
 * @version 0.2.3
 */

const axios = require('axios');

/**
 * Send deployment status notification email
 * @async
 * @function sendDeploymentNotification
 * @param {string} email - Recipient email address
 * @param {string} projectId - Unique project identifier
 * @param {string} deploymentId - Unique deployment identifier
 * @param {string} status - Deployment status ('success', 'failed', 'in_progress', etc.)
 * @param {string|null} [errorMessage=null] - Optional error message for failed deployments
 * @returns {Promise<void>} Resolves when notification is sent or fails silently
 * @throws {Error} Network or service communication errors (caught internally)
 * @description Sends deployment status notification to user via backend notification service.
 * Fails silently if notification service is unavailable.
 * @example
 * await sendDeploymentNotification(
 *   'user@example.com',
 *   'proj123',
 *   'deploy456',
 *   'success'
 * );
 * 
 * // With error message
 * await sendDeploymentNotification(
 *   'user@example.com',
 *   'proj123',
 *   'deploy456',
 *   'failed',
 *   'Build failed: missing dependencies'
 * );
 */
const sendDeploymentNotification = async (email, projectId, deploymentId, status, errorMessage = null) => {
    try {
        const payload = {
            email,
            projectId,
            deploymentId,
            status
        };
        
        if (errorMessage) {
            payload.errorMessage = errorMessage;
        }
        
        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/notifications/deployment`, payload, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Email notification sent to ${email} for deployment ${deploymentId} [${status}]`);
    } catch (err) {
        console.error("Failed to send email notification:", err.message);
    }
};

/**
 * Export email notification functions
 * @module emailNotifier
 * @description Service for sending deployment status notifications
 */
module.exports = { sendDeploymentNotification };

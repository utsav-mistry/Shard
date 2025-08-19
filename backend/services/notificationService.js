/**
 * @fileoverview Notification Service
 * @description Handles email notifications for deployment status updates
 * @module services/notificationService
 * @requires ../config/smtp
 * @author Utsav Mistry
 * @version 1.0.0
 */

const transporter = require("../config/smtp");

/**
 * Sends deployment status notification email to user
 * @async
 * @function sendDeploymentNotification
 * @param {string} userEmail - Recipient email address
 * @param {string} projectId - MongoDB ObjectId of the project
 * @param {string} status - Deployment status (success, failed, or custom status)
 * @returns {Promise<void>}
 * @throws {Error} If email sending fails
 * @example
 * await sendDeploymentNotification('user@example.com', '507f1f77bcf86cd799439011', 'success');
 */
const sendDeploymentNotification = async (userEmail, projectId, status) => {
    let subject = "";
    let text = "";

    if (status === "success") {
        subject = "Deployment Successful!";
        text = `Your project (ID: ${projectId}) has been successfully deployed and is live.`;
    } else if (status === "failed") {
        subject = "Deployment Failed!";
        text = `Unfortunately, your deployment (ID: ${projectId}) has failed. Please check your logs for details.`;
    } else {
        subject = "Deployment Update";
        text = `Your deployment status for project ID: ${projectId} is now "${status}".`;
    }

    const mailOptions = {
        from: `"Shard" <noreply@onvaultify.xyz>`,
        to: userEmail,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent to", userEmail);
    } catch (err) {
        console.error("Failed to send deployment email:", err);
    }
};

/**
 * @namespace notificationService
 * @description Service for sending deployment status notifications
 */
module.exports = { sendDeploymentNotification };

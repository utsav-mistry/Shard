/**
 * @fileoverview Webhook Service
 * @description Handles webhook notifications for deployment events and integrations
 * @module services/webhookService
 * @requires axios
 * @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require('axios');

/**
 * Sends webhook notification to external URL
 * @async
 * @function sendWebhook
 * @param {string} url - Webhook URL to send notification to
 * @param {Object} payload - Data to send in webhook
 * @param {Object} [options={}] - Additional options for webhook
 * @param {Object} [options.headers={}] - Custom headers to include
 * @param {number} [options.timeout=5000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Response from webhook endpoint
 * @throws {Error} If webhook delivery fails
 * @example
 * await sendWebhook('https://api.example.com/webhook', {
 *   event: 'deployment.success',
 *   projectId: '123',
 *   timestamp: new Date().toISOString()
 * });
 */
const sendWebhook = async (url, payload, options = {}) => {
    const { headers = {}, timeout = 5000 } = options;
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Shard-Platform/1.0',
                ...headers
            },
            timeout
        });
        
        console.log(`Webhook delivered successfully to ${url}`);
        return response.data;
    } catch (error) {
        console.error(`Webhook delivery failed to ${url}:`, error.message);
        throw error;
    }
};

/**
 * Sends deployment status webhook
 * @async
 * @function sendDeploymentWebhook
 * @param {string} webhookUrl - Webhook URL
 * @param {Object} deployment - Deployment data
 * @param {string} status - Deployment status (success, failed, started)
 * @returns {Promise<void>}
 * @example
 * await sendDeploymentWebhook('https://api.example.com/webhook', deployment, 'success');
 */
const sendDeploymentWebhook = async (webhookUrl, deployment, status) => {
    const payload = {
        event: `deployment.${status}`,
        deployment: {
            id: deployment._id,
            projectId: deployment.projectId,
            status: deployment.status,
            createdAt: deployment.createdAt,
            updatedAt: deployment.updatedAt
        },
        timestamp: new Date().toISOString()
    };
    
    await sendWebhook(webhookUrl, payload);
};

/**
 * @namespace webhookService
 * @description Service for sending webhook notifications
 */
module.exports = {
    sendWebhook,
    sendDeploymentWebhook
};
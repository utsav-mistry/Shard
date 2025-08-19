/**
 * @fileoverview Deployment Status Update Service
 * @description Service for updating deployment status in backend database
 * @author Utsav Mistry
 * @version 0.2.3
 */

const axios = require('axios');

/**
 * Update deployment status in backend database
 * @async
 * @function updateDeploymentStatus
 * @param {string} deploymentId - Unique deployment identifier
 * @param {string} status - New deployment status ('pending', 'reviewing', 'configuring', 'building', 'success', 'failed')
 * @param {string} token - JWT authentication token for API access
 * @param {Object} [additionalData] - Optional additional data to include in update
 * @returns {Promise<void>} Resolves when status is updated or fails silently
 * @throws {Error} Network or authentication errors (caught internally)
 * @description Updates deployment status in backend database via REST API.
 * Fails silently if backend is unavailable to prevent deployment interruption.
 * @example
 * await updateDeploymentStatus('deploy123', 'building', 'jwt_token');
 * await updateDeploymentStatus('deploy123', 'failed', 'jwt_token', { reason: 'Build error' });
 */
const updateDeploymentStatus = async (deploymentId, status, token, additionalData = {}) => {
    try {
        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deploy/update-status`, {
            deploymentId,
            status,
            ...additionalData
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            timeout: 5000
        });
        console.log(`Deployment status updated: ${deploymentId} [${status}]`);
    } catch (err) {
        console.error("Failed to update deployment status:", err.message);
    }
};

/**
 * Export status update functions
 * @module statusUpdater
 * @description Service for updating deployment status in backend database
 */
module.exports = { updateDeploymentStatus };
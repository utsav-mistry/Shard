import axios from 'axios';

/**
 * Updates the deployment status in the backend database
 * @param {string} deploymentId - The ID of the deployment to update
 * @param {string} status - The new status (pending, running, success, failed)
 * @param {string} token - Authentication token for API access
 */
const updateDeploymentStatus = async (deploymentId, status, token) => {
    try {
        await axios.post("http://localhost:5000/deploy/update-status", {
            deploymentId,
            status
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

export { updateDeploymentStatus };
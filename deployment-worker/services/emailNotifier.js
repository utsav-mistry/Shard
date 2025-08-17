const axios = require('axios');

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

module.exports = { sendDeploymentNotification };

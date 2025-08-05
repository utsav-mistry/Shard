const axios = require("axios");

const sendDeploymentNotification = async (email, projectId, status) => {
    try {
        await axios.post("http://localhost:5000/notifications/deployment", {
            email,
            projectId,
            status,
        });
        console.log(`Email sent to ${email} for project ${projectId} [${status}]`);
    } catch (err) {
        console.error("Failed to send email notification:", err.message);
    }
};

module.exports = { sendDeploymentNotification };

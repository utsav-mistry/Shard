const transporter = require("../config/smtp");

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

module.exports = { sendDeploymentNotification };

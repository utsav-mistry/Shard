const Logs = require("../models/Logs");

// Create new log entry (used by worker or backend)
const addLog = async (projectId, deploymentId, type, content) => {
    const logEntry = await Logs.create({
        projectId,
        deploymentId,
        type,
        content,
        timestamp: new Date(),
    });

    return logEntry;
};

// Get logs for deployment (for frontend display)
const getDeploymentLogs = async (deploymentId) => {
    const logs = await Logs.find({ deploymentId }).sort({ timestamp: 1 });

    return logs.map(log => ({
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
    }));
};

// (Optional) Delete logs (cleanup)
const deleteLogsByDeployment = async (deploymentId) => {
    await Logs.deleteMany({ deploymentId });
};

module.exports = {
    addLog,
    getDeploymentLogs,
    deleteLogsByDeployment,
};

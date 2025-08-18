const Log = require("../models/Logs");

// Create log entry (called from worker)
const createLog = async (req, res) => {
    const { projectId, deploymentId, type, content } = req.body;

    try {
        const log = await Log.create({
            projectId,
            deploymentId,
            type,
            content,
        });

        res.status(201).json(log);
    } catch (err) {
        console.error("Log creation error:", err);
        res.status(500).json({ message: "Failed to save log" });
    }
};

// Fetch logs for a deployment (called from frontend)
const getLogs = async (req, res) => {
    const { deploymentId } = req.params;

    try {
        const logs = await Log.find({ deploymentId }).sort({ createdAt: 1 });
                res.json({ success: true, data: logs });
    } catch (err) {
        console.error("Log fetch error:", err);
        res.status(500).json({ message: "Failed to fetch logs" });
    }
};

module.exports = { createLog, getLogs };

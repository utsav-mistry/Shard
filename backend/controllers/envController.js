const envService = require("../services/envService");

// Create env variable
const addEnvVar = async (req, res) => {
    const { projectId, key, value } = req.body;

    try {
        const envVar = await envService.addEnvVar(projectId, key, value);
        res.status(201).json(envVar);
    } catch (err) {
        console.error("Failed to add env var:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all env variables for project
const getEnvVars = async (req, res) => {
    const { projectId } = req.params;

    try {
        const decryptedVars = await envService.getEnvVars(projectId);
        res.json(decryptedVars);
    } catch (err) {
        console.error("Failed to fetch env vars:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete env variable
const deleteEnvVar = async (req, res) => {
    const { id } = req.params;

    try {
        await envService.deleteEnvVar(id);
        res.status(200).json({ message: "Env var deleted" });
    } catch (err) {
        console.error("Failed to delete env var:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { addEnvVar, getEnvVars, deleteEnvVar };

const path = require("path");
const fs = require("fs");
const express = require("express");
const { createLog, getLogs } = require("../controllers/logController");
const { protect } = require("../utils/authMiddleware");

const router = express.Router();

// Worker calls this route — no auth (internal service call)
router.post("/", createLog);

// Frontend calls this route — protected (user must be logged in)
router.get("/:deploymentId", protect, getLogs);

// Define log directory path
const LOG_DIR = path.join(__dirname, "../../../deployment-worker/logs");

// Protected route for downloading logs - requires authentication
router.get("/download/:deploymentId", protect, (req, res) => {
    const { deploymentId } = req.params;
    const logPath = path.join(LOG_DIR, `${deploymentId}.log`);

    if (!fs.existsSync(logPath)) {
        return res.status(404).json({ message: "Log not found." });
    }

    res.download(logPath, `${deploymentId}.log`);
});

module.exports = router;

/**
 * @fileoverview Log Controller
 * @description Handles deployment log operations including creation and retrieval
 *              for real-time deployment monitoring in the Shard platform
 * @author Utsav Mistry
 * @version 1.0.0
 */

const Log = require("../models/Logs");

/**
 * Create new log entry for deployment tracking
 * @async
 * @function createLog
 * @param {Object} req - Express request object
 * @param {string} req.body.projectId - MongoDB ObjectId of the project
 * @param {string} req.body.deploymentId - MongoDB ObjectId of the deployment
 * @param {string} req.body.type - Log type (build, deploy, error, info, etc.)
 * @param {string} req.body.content - Log message content
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns created log object or error response
 * @throws {ValidationError} When required fields are missing
 * @throws {ServerError} When database operations fail
 * @description Creates deployment log entries called by deployment worker
 * @note Used for real-time deployment progress tracking
 * @note Log entries are displayed in deployment progress UI
 * @example
 * // Called by deployment worker
 * POST /api/logs
 * {
 *   "projectId": "64a1b2c3d4e5f6789012345",
 *   "deploymentId": "64a1b2c3d4e5f6789012346",
 *   "type": "build",
 *   "content": "Installing dependencies..."
 * }
 */
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

/**
 * Retrieve all logs for a specific deployment
 * @async
 * @function getLogs
 * @param {Object} req - Express request object
 * @param {string} req.params.deploymentId - MongoDB ObjectId of the deployment
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns array of log entries or error response
 * @throws {ServerError} When database operations fail
 * @description Fetches deployment logs for frontend display in chronological order
 * @note Logs are sorted by creation time (oldest first) for proper sequence
 * @note Used by deployment progress page and log viewer components
 * @note Returns logs in standardized API response format
 * @example
 * // Called by frontend
 * GET /api/logs/:deploymentId
 * // Returns: { success: true, data: [log1, log2, ...] }
 */
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

/**
 * Export log controller functions
 * @module logController
 * @description Provides deployment log management for real-time monitoring
 */
module.exports = { createLog, getLogs };

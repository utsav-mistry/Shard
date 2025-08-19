/**
 * @fileoverview Log Service
 * @description Manages deployment logs and system logging operations
 * @module services/logService
 * @requires ../models/Logs
 * @author Utsav Mistry
 * @version 1.0.0
 */

const Logs = require("../models/Logs");

/**
 * Creates new log entry for deployment or system events
 * @async
 * @function addLog
 * @param {string} projectId - MongoDB ObjectId of the project
 * @param {string} deploymentId - MongoDB ObjectId of the deployment
 * @param {string} type - Log type (info, error, warning, success)
 * @param {string} content - Log message content
 * @returns {Promise<Object>} Created log entry document
 * @example
 * await addLog('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'info', 'Deployment started');
 */
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

/**
 * Retrieves logs for a specific deployment
 * @async
 * @function getDeploymentLogs
 * @param {string} deploymentId - MongoDB ObjectId of the deployment
 * @returns {Promise<Array<Object>>} Array of log entries sorted by timestamp
 * @example
 * const logs = await getDeploymentLogs('507f1f77bcf86cd799439012');
 * console.log(logs); // [{ type, content, timestamp }]
 */
const getDeploymentLogs = async (deploymentId) => {
    const logs = await Logs.find({ deploymentId }).sort({ timestamp: 1 });

    return logs.map(log => ({
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
    }));
};

/**
 * Deletes all logs for a specific deployment (cleanup operation)
 * @async
 * @function deleteLogsByDeployment
 * @param {string} deploymentId - MongoDB ObjectId of the deployment
 * @returns {Promise<void>}
 * @example
 * await deleteLogsByDeployment('507f1f77bcf86cd799439012');
 */
const deleteLogsByDeployment = async (deploymentId) => {
    await Logs.deleteMany({ deploymentId });
};

/**
 * @namespace logService
 * @description Service for managing deployment and system logs
 */
module.exports = {
    addLog,
    getDeploymentLogs,
    deleteLogsByDeployment,
};

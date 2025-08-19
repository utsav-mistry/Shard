/**
 * @fileoverview Health Check Routes
 * @description Express routes for deployment worker health monitoring and system status
 * @author Utsav Mistry
 * @version 0.2.3
 */

const express = require('express');
const path = require('path');
const pkg = require('../package.json');
const { isDockerRunning } = require('../utils/dockerChecker');

const router = express.Router();

/**
 * Format uptime in seconds to a human-readable string
 * @function formatUptime
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string (e.g., "2d 3h 45m 12s")
 * @description Converts process uptime to human-readable format
 * @note Returns 'N/A' for invalid input values
 */
function formatUptime(seconds) {
    if (isNaN(seconds) || seconds < 0) return 'N/A';
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}
/**
 * Comprehensive health check endpoint
 * @route GET /
 * @returns {Object} Detailed system health information
 * @returns {string} returns.status - Overall system status
 * @returns {string} returns.timestamp - Current timestamp
 * @returns {number} returns.uptime - Process uptime in seconds
 * @returns {Object} returns.queue - Job queue status and statistics
 * @returns {Object} returns.docker - Docker daemon status
 * @returns {Object} returns.memory - Memory usage statistics
 * @returns {string} returns.version - Application version
 * @returns {Object} returns.display - Human-readable status summaries
 * @description Provides comprehensive health check including queue, Docker, and memory status
 * @note Used by monitoring systems and load balancers for health verification
 */
router.get('/', async (req, res) => {
    const queue = req.app.get('queue');
    const memoryUsage = process.memoryUsage();
    
    // Check Docker status
    const dockerStatus = await isDockerRunning();
    
    // Helper function to get queue info
    const getQueueInfo = () => {
        if (!queue) {
            return {
                active: 0,
                queued: 0,
                concurrency: 0,
                error: 'Queue not initialized'
            };
        }
        
        // Handle different concurrency formats
        let concurrency = 0;
        if (typeof queue.concurrency === 'object' && queue.concurrency !== null) {
            concurrency = queue.concurrency.concurrency || 0;
        } else {
            concurrency = Number(queue.concurrency) || 0;
        }
        
        return {
            active: queue.activeJobs?.size || 0,
            queued: queue.queue?.length || 0,
            concurrency: concurrency
        };
    };
    
    // Get queue info
    const queueInfo = getQueueInfo();
    
    // Create status object
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        queue: queueInfo,
        docker: {
            running: dockerStatus,
            status: dockerStatus ? 'available' : 'unavailable'
        },
        memory: {
            heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
            rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB'
        },
        version: pkg.version || 'unknown',
        display: {
            queue: queue ? 
                `${queueInfo.active} active, ${queueInfo.queued} queued (${queueInfo.concurrency} max)` :
                'Queue not initialized',
            memory: memoryUsage ? 
                `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB` :
                'N/A',
            uptime: formatUptime(process.uptime()),
            docker: dockerStatus ? 'Running' : 'Not Available'
        }
    };
    
    res.status(200).json(status);
});

/**
 * Export health check routes
 * @module healthRoutes
 * @description Express router for deployment worker health monitoring
 */
module.exports = router;

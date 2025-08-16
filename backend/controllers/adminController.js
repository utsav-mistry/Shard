const axios = require("axios");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const User = require("../models/User");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");

// Get system statistics
const getSystemStats = async (req, res) => {
    try {
        const stats = {
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                uptime: process.uptime(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    processUsage: process.memoryUsage()
                },
                cpu: {
                    cores: os.cpus().length,
                    loadAverage: os.loadavg()
                }
            },
            database: {
                totalUsers: await User.countDocuments(),
                totalProjects: await Project.countDocuments(),
                totalDeployments: await Deployment.countDocuments(),
                activeDeployments: await Deployment.countDocuments({
                    status: { $in: ['pending', 'building', 'deploying'] }
                })
            },
            services: {
                backend: {
                    status: 'running',
                    port: process.env.PORT || 5000,
                    environment: process.env.NODE_ENV || 'development'
                }
            }
        };

        return res.apiSuccess(stats, 'System statistics retrieved successfully');
    } catch (error) {
        console.error("Error getting system stats:", error);
        return res.apiServerError('Failed to get system statistics', error.message);
    }
};

// Get active deployments with details
const getActiveDeployments = async (req, res) => {
    try {
        const deployments = await Deployment.find({
            status: { $in: ['pending', 'building', 'deploying', 'pending_review'] }
        })
            .populate('projectId', 'name subdomain stack')
            .sort({ createdAt: -1 })
            .limit(50);

        const deploymentsWithDetails = deployments.map(deployment => ({
            id: deployment._id,
            projectName: deployment.projectId?.name || 'Unknown',
            subdomain: deployment.projectId?.subdomain || 'Unknown',
            stack: deployment.projectId?.stack || 'Unknown',
            status: deployment.status,
            createdAt: deployment.createdAt,
            startedAt: deployment.startedAt,
            duration: deployment.startedAt ?
                Math.floor((new Date() - deployment.startedAt) / 1000) : null
        }));

        return res.apiSuccess(deploymentsWithDetails, 'Active deployments retrieved successfully');
    } catch (error) {
        console.error("Error getting active deployments:", error);
        return res.apiServerError('Failed to get active deployments', error.message);
    }
};

// Get system logs (last 100 entries)
const getSystemLogs = async (req, res) => {
    try {
        const { level = 'all', limit = 100 } = req.query;

        // Try to read from log files
        const logDir = path.join(process.cwd(), 'logs');
        const logFiles = ['combined.log', 'error.log'];
        const logs = [];

        for (const logFile of logFiles) {
            try {
                const logPath = path.join(logDir, logFile);
                const logContent = await fs.readFile(logPath, 'utf8');
                const logLines = logContent.split('\n')
                    .filter(line => line.trim())
                    .slice(-parseInt(limit))
                    .map(line => {
                        try {
                            return JSON.parse(line);
                        } catch {
                            return { message: line, timestamp: new Date().toISOString() };
                        }
                    });

                logs.push(...logLines);
            } catch (fileError) {
                // Log file doesn't exist or can't be read
                continue;
            }
        }

        // Sort by timestamp and apply level filter
        const filteredLogs = logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .filter(log => level === 'all' || log.level === level)
            .slice(0, parseInt(limit));

        return res.apiSuccess(filteredLogs, 'System logs retrieved successfully');
    } catch (error) {
        console.error("Error getting system logs:", error);
        return res.apiServerError('Failed to get system logs', error.message);
    }
};

// Get deployment worker status
const getWorkerStatus = async (req, res) => {
    try {
        const workerUrl = process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000';

        const response = await axios.get(`${workerUrl}/health`, {
            timeout: 5000
        });

        return res.apiSuccess({
            status: 'running',
            url: workerUrl,
            ...response.data
        }, 'Deployment worker status retrieved successfully');
    } catch (error) {
        return res.apiSuccess({
            status: 'error',
            url: process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 'Deployment worker status retrieved (with errors)');
    }
};

// Get AI service status
const getAIServiceStatus = async (req, res) => {
    try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

        // Try to ping the AI service
        const response = await axios.get(`${aiServiceUrl}/`, {
            timeout: 5000
        });

        return res.apiSuccess({
            status: 'running',
            url: aiServiceUrl,
            responseTime: response.headers['x-response-time'] || 'unknown',
            timestamp: new Date().toISOString()
        }, 'AI service status retrieved successfully');
    } catch (error) {
        return res.apiSuccess({
            status: 'error',
            url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 'AI service status retrieved (with errors)');
    }
};

module.exports = {
    getSystemStats,
    getActiveDeployments,
    getSystemLogs,
    getWorkerStatus,
    getAIServiceStatus
};

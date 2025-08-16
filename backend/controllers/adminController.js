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

// CRUD Operations for Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        
        return res.apiSuccess(users, 'Users retrieved successfully');
    } catch (error) {
        console.error("Error getting users:", error);
        return res.apiServerError('Failed to get users', error.message);
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;
        
        const user = await User.findByIdAndUpdate(
            id,
            { name, email, role },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        
        if (!user) {
            return res.apiNotFound('User not found');
        }
        
        return res.apiSuccess(user, 'User updated successfully');
    } catch (error) {
        console.error("Error updating user:", error);
        return res.apiServerError('Failed to update user', error.message);
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.apiNotFound('User not found');
        }
        
        return res.apiSuccess(null, 'User deleted successfully');
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.apiServerError('Failed to delete user', error.message);
    }
};

// CRUD Operations for Projects
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({})
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 });
        
        return res.apiSuccess(projects, 'Projects retrieved successfully');
    } catch (error) {
        console.error("Error getting projects:", error);
        return res.apiServerError('Failed to get projects', error.message);
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, repoUrl, stack, subdomain, status } = req.body;
        
        const project = await Project.findByIdAndUpdate(
            id,
            { name, repoUrl, stack, subdomain, status },
            { new: true, runValidators: true }
        ).populate('ownerId', 'name email');
        
        if (!project) {
            return res.apiNotFound('Project not found');
        }
        
        return res.apiSuccess(project, 'Project updated successfully');
    } catch (error) {
        console.error("Error updating project:", error);
        return res.apiServerError('Failed to update project', error.message);
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByIdAndDelete(id);
        if (!project) {
            return res.apiNotFound('Project not found');
        }
        
        return res.apiSuccess(null, 'Project deleted successfully');
    } catch (error) {
        console.error("Error deleting project:", error);
        return res.apiServerError('Failed to delete project', error.message);
    }
};

// CRUD Operations for Deployments
const getAllDeployments = async (req, res) => {
    try {
        const deployments = await Deployment.find({})
            .populate('projectId', 'name subdomain stack')
            .sort({ createdAt: -1 })
            .limit(100);
        
        return res.apiSuccess(deployments, 'Deployments retrieved successfully');
    } catch (error) {
        console.error("Error getting deployments:", error);
        return res.apiServerError('Failed to get deployments', error.message);
    }
};

const updateDeployment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        
        const deployment = await Deployment.findByIdAndUpdate(
            id,
            { status, message },
            { new: true, runValidators: true }
        ).populate('projectId', 'name subdomain stack');
        
        if (!deployment) {
            return res.apiNotFound('Deployment not found');
        }
        
        return res.apiSuccess(deployment, 'Deployment updated successfully');
    } catch (error) {
        console.error("Error updating deployment:", error);
        return res.apiServerError('Failed to update deployment', error.message);
    }
};

const deleteDeployment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deployment = await Deployment.findByIdAndDelete(id);
        if (!deployment) {
            return res.apiNotFound('Deployment not found');
        }
        
        return res.apiSuccess(null, 'Deployment deleted successfully');
    } catch (error) {
        console.error("Error deleting deployment:", error);
        return res.apiServerError('Failed to delete deployment', error.message);
    }
};

// Generic database CRUD operations
const getTableData = async (req, res) => {
    try {
        const { tableName } = req.params;
        let data = [];
        
        switch (tableName) {
            case 'users':
                data = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
                break;
            case 'projects':
                data = await Project.find({}).populate('ownerId', 'name email').sort({ createdAt: -1 });
                break;
            case 'deployments':
                data = await Deployment.find({}).populate('projectId', 'name subdomain').sort({ createdAt: -1 }).limit(100);
                break;
            case 'logs':
                // For logs, we'll return recent entries
                data = [];
                break;
            default:
                return res.apiBadRequest('Invalid table name');
        }
        
        return res.apiSuccess(data, `${tableName} data retrieved successfully`);
    } catch (error) {
        console.error(`Error getting ${req.params.tableName} data:`, error);
        return res.apiServerError(`Failed to get ${req.params.tableName} data`, error.message);
    }
};

const createRecord = async (req, res) => {
    try {
        const { tableName } = req.params;
        const recordData = req.body;
        let newRecord;
        
        switch (tableName) {
            case 'users':
                newRecord = new User(recordData);
                await newRecord.save();
                newRecord = await User.findById(newRecord._id).select('-passwordHash');
                break;
            case 'projects':
                newRecord = new Project(recordData);
                await newRecord.save();
                newRecord = await Project.findById(newRecord._id).populate('ownerId', 'name email');
                break;
            case 'deployments':
                newRecord = new Deployment(recordData);
                await newRecord.save();
                newRecord = await Deployment.findById(newRecord._id).populate('projectId', 'name subdomain');
                break;
            default:
                return res.apiBadRequest('Invalid table name');
        }
        
        return res.apiSuccess(newRecord, `${tableName.slice(0, -1)} created successfully`);
    } catch (error) {
        console.error(`Error creating ${req.params.tableName} record:`, error);
        return res.apiServerError(`Failed to create ${req.params.tableName} record`, error.message);
    }
};

const updateRecord = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        const recordData = req.body;
        let updatedRecord;
        
        switch (tableName) {
            case 'users':
                updatedRecord = await User.findByIdAndUpdate(
                    id,
                    recordData,
                    { new: true, runValidators: true }
                ).select('-passwordHash');
                break;
            case 'projects':
                updatedRecord = await Project.findByIdAndUpdate(
                    id,
                    recordData,
                    { new: true, runValidators: true }
                ).populate('ownerId', 'name email');
                break;
            case 'deployments':
                updatedRecord = await Deployment.findByIdAndUpdate(
                    id,
                    recordData,
                    { new: true, runValidators: true }
                ).populate('projectId', 'name subdomain');
                break;
            default:
                return res.apiBadRequest('Invalid table name');
        }
        
        if (!updatedRecord) {
            return res.apiNotFound(`${tableName.slice(0, -1)} not found`);
        }
        
        return res.apiSuccess(updatedRecord, `${tableName.slice(0, -1)} updated successfully`);
    } catch (error) {
        console.error(`Error updating ${req.params.tableName} record:`, error);
        return res.apiServerError(`Failed to update ${req.params.tableName} record`, error.message);
    }
};

const deleteRecord = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        let deletedRecord;
        
        switch (tableName) {
            case 'users':
                deletedRecord = await User.findByIdAndDelete(id);
                break;
            case 'projects':
                deletedRecord = await Project.findByIdAndDelete(id);
                break;
            case 'deployments':
                deletedRecord = await Deployment.findByIdAndDelete(id);
                break;
            default:
                return res.apiBadRequest('Invalid table name');
        }
        
        if (!deletedRecord) {
            return res.apiNotFound(`${tableName.slice(0, -1)} not found`);
        }
        
        return res.apiSuccess(null, `${tableName.slice(0, -1)} deleted successfully`);
    } catch (error) {
        console.error(`Error deleting ${req.params.tableName} record:`, error);
        return res.apiServerError(`Failed to delete ${req.params.tableName} record`, error.message);
    }
};

const getTables = async (req, res) => {
    try {
        const tables = [
            { name: 'users', count: await User.countDocuments() },
            { name: 'projects', count: await Project.countDocuments() },
            { name: 'deployments', count: await Deployment.countDocuments() },
            { name: 'logs', count: 0 }
        ];
        
        return res.apiSuccess(tables, 'Tables retrieved successfully');
    } catch (error) {
        console.error("Error getting tables:", error);
        return res.apiServerError('Failed to get tables', error.message);
    }
};

module.exports = {
    getSystemStats,
    getActiveDeployments,
    getSystemLogs,
    getWorkerStatus,
    getAIServiceStatus,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllProjects,
    updateProject,
    deleteProject,
    getAllDeployments,
    updateDeployment,
    deleteDeployment,
    // Generic database CRUD
    getTableData,
    createRecord,
    updateRecord,
    deleteRecord,
    getTables
};

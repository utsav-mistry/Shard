const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Logs = require('../models/Logs');

// Get logs for a specific deployment
router.get('/:deploymentId', authenticate, async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const logs = await Logs.find({ deploymentId }).sort({ createdAt: 1 });
        
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
});

// Receive deployment logs from deployment worker and broadcast via Socket.IO
// No auth required - internal service call
router.post('/', async (req, res) => {
    try {
        const { projectId, deploymentId, type, content, step, level } = req.body;

        // Validate required fields
        if (!deploymentId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: deploymentId, content'
            });
        }

        // Create log entry
        const logEntry = new Logs({
            projectId,
            deploymentId,
            type: type || 'info',
            content,
            step,
            level: level || 'info',
            createdAt: new Date()
        });

        await logEntry.save();

        // Broadcast to Socket.IO clients subscribed to this deployment
        const io = req.app.locals.io;
        if (io) {
            const socketLogEntry = {
                id: logEntry._id,
                projectId,
                deploymentId,
                step: step || type,
                level: level || 'info',
                message: content,
                timestamp: logEntry.createdAt.toISOString()
            };
            
            io.to(`deployment-${deploymentId}`).emit('deployment-log', socketLogEntry);
        }

        res.json({
            success: true,
            message: 'Log entry created and broadcasted',
            data: logEntry
        });
    } catch (error) {
        console.error('Error creating log entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create log entry',
            error: error.message
        });
    }
});

module.exports = router;

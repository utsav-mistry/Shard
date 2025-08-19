/**
 * @swagger
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Log entry ID
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *         deploymentId:
 *           type: string
 *           description: Associated deployment ID
 *         type:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           description: Log entry type
 *         content:
 *           type: string
 *           description: Log message content
 *         step:
 *           type: string
 *           description: Deployment step
 *         level:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           description: Log level
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Log entry timestamp
 *     
 *     CreateLogRequest:
 *       type: object
 *       required:
 *         - deploymentId
 *         - content
 *       properties:
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *         deploymentId:
 *           type: string
 *           description: Associated deployment ID
 *         type:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           default: info
 *           description: Log entry type
 *         content:
 *           type: string
 *           description: Log message content
 *         step:
 *           type: string
 *           description: Deployment step
 *         level:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           default: info
 *           description: Log level
 * 
 * tags:
 *   - name: Logs
 *     description: Deployment log operations
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Logs = require('../models/Logs');

/**
 * @swagger
 * /api/logs/{deploymentId}:
 *   get:
 *     summary: Get deployment logs
 *     description: Retrieve all logs for a specific deployment
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LogEntry'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Deployment not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to fetch logs
 *                 error:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create deployment log entry
 *     description: Create a new log entry for a deployment (internal service endpoint)
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLogRequest'
 *           example:
 *             projectId: 507f1f77bcf86cd799439011
 *             deploymentId: 507f1f77bcf86cd799439012
 *             type: info
 *             content: Starting deployment process...
 *             step: clone
 *             level: info
 *     responses:
 *       200:
 *         description: Log entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Log entry created and broadcasted
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Missing required fields: deploymentId, content
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to create log entry
 *                 error:
 *                   type: string
 */
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

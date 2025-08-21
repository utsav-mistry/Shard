/**
 * @swagger
 * tags:
 *   - name: Logs
 *     description: Deployment log operations
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Log entry ID
 *           example: 60d0fe4f5311236168a109cc
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *           example: 60d0fe4f5311236168a109ca
 *         deploymentId:
 *           type: string
 *           description: Associated deployment ID
 *           example: 60d0fe4f5311236168a109cb
 *         type:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           description: Log entry type
 *           example: info
 *         content:
 *           type: string
 *           description: Log message content
 *           example: Cloning repository...
 *         step:
 *           type: string
 *           description: Deployment step
 *           example: clone
 *         level:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           description: Log level
 *           example: info
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
 *           example: 60d0fe4f5311236168a109ca
 *         deploymentId:
 *           type: string
 *           description: Associated deployment ID
 *           example: 60d0fe4f5311236168a109cb
 *         type:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           default: info
 *           description: Log entry type
 *           example: info
 *         content:
 *           type: string
 *           description: Log message content
 *           example: Starting build process...
 *         step:
 *           type: string
 *           description: Deployment step
 *           example: build
 *         level:
 *           type: string
 *           enum: [info, error, warning, debug]
 *           default: info
 *           description: Log level
 *           example: info
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Logs = require('../models/Logs');

/**
 * @swagger
 * /{deploymentId}:
 *   get:
 *     summary: Get deployment logs
 *     description: Retrieve all logs for a specific deployment.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The ID of the deployment to fetch logs for.
 *     responses:
 *       200:
 *         description: A list of log entries for the deployment.
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
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * /:
 *   post:
 *     summary: Create a deployment log entry
 *     description: >
 *       Creates a new log entry for a deployment. This is an internal endpoint intended to be called by the deployment worker service.
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLogRequest'
 *     responses:
 *       200:
 *         description: Log entry created and broadcasted successfully.
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
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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

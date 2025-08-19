/**
 * @fileoverview Health Dashboard Routes
 * @description Express routes for health monitoring and system status checks
 * @module routes/health-dashboard-new
 * @requires express
 * @requires mongoose
 * @requires ../utils/logger
 * @requires ../services/healthService
 * @author Utsav Mistry
 * @version 0.0.1
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceHealth:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, error]
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *         timestamp:
 *           type: string
 *           format: date-time
 *         details:
 *           type: object
 *           description: Additional service-specific health details
 *           properties:
 *             status:
 *               type: string
 *               example: 'connected'
 *             version:
 *               type: string
 *               example: '5.0.0'
 * 
 * tags:
 *   - name: Health
 *     description: Health check operations
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getAggregatedHealth } = require('../services/healthService');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the aggregated health status of the application and all its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded, error]
 *                   example: 'ok'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 db:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                     version:
 *                       type: string
 *                     collections:
 *                       type: number
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     external:
 *                       type: number
 *                 services:
 *                   type: object
 *                   description: Health status of all dependent services
 *                   properties:
 *                     deployment-worker:
 *                       $ref: '#/components/schemas/ServiceHealth'
 *                     ai-review:
 *                       $ref: '#/components/schemas/ServiceHealth'
 *       503:
 *         description: Service Unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'error'
 *                 error:
 *                   type: string
 *                   example: 'Database connection failed'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'error'
 *                 error:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const dbVersion = await getDbVersion();

        // Get health status from all services
        const servicesHealth = await getAggregatedHealth();

        // Determine overall status based on DB and services
        const dbHealthy = dbStatus === 'connected';
        const allServicesHealthy = servicesHealth.status === 'ok';
        const overallStatus = dbHealthy && allServicesHealthy ? 'ok' : 'degraded';

        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: {
                status: dbStatus,
                version: dbVersion,
                collections: await getCollectionCount()
            },
            memory: process.memoryUsage(),
            services: servicesHealth.services || {
                'deployment-worker': { status: 'error', error: 'Health check not available' },
                'ai-review': { status: 'error', error: 'Health check not available' }
            }
        };

        res.status(overallStatus === 'ok' ? 200 : 503).json(response);

    } catch (error) {
        logger.error(`Health check failed: ${error.message}`, { error });

        const errorResponse = {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString(),
            services: {
                'deployment-worker': { status: 'error', error: 'Health check failed' },
                'ai-review': { status: 'error', error: 'Health check failed' }
            }
        };

        res.status(500).json(errorResponse);
    }
});

// Helper function to safely get database version
async function getDbVersion() {
    try {
        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        return serverStatus.version;
    } catch (error) {
        logger.warn('Could not get database version', { error: error.message });
        return 'unknown';
    }
}

// Helper function to get collection count
async function getCollectionCount() {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        return collections.length;
    } catch (error) {
        logger.warn('Could not get collection count', { error: error.message });
        return null;
    }
}

/**
 * @namespace healthDashboardRoutes
 * @description Express router for health monitoring and system status endpoints
 */
module.exports = router;

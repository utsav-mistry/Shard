import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint for deployment worker
 *     description: Returns the health status of the deployment worker service
 *     responses:
 *       200:
 *         description: Worker is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'ok'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 queue:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: number
 *                       description: Number of active jobs
 *                     queued:
 *                       type: number
 *                       description: Number of jobs in queue
 *                     concurrency:
 *                       type: number
 *                       description: Maximum concurrent jobs
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       description: Resident set size in bytes
 *                     heapTotal:
 *                       type: number
 *                       description: Total size of the allocated heap
 *                     heapUsed:
 *                       type: number
 *                       description: Heap actually used
 *                     external:
 *                       type: number
 *                       description: Memory used by C++ objects bound to JavaScript objects
 */
router.get('/', (req, res) => {
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        queue: {
            active: req.app.get('queue').activeJobs.size,
            queued: req.app.get('queue').queue.length,
            concurrency: req.app.get('queue').concurrency
        },
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || 'unknown'
    };
    
    res.status(200).json(status);
});

export default router;

/**
 * @fileoverview Deployment Routes
 * @description Express routes for deployment management, status tracking, and logs
 * @module routes/deploy
 * @requires express
 * @requires ../controllers/deployController
 * @requires ../middleware/auth
 * @requires ../middleware/validate
 * @author Utsav Mistry
 * @version 1.0.0
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Deployment:
 *       type: object
 *       required:
 *         - projectId
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Deployment ID
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *         status:
 *           type: string
 *           enum: [pending, building, deploying, deployed, failed, cancelled]
 *           description: Deployment status
 *         step:
 *           type: string
 *           description: Current deployment step
 *         logs:
 *           type: array
 *           items:
 *             type: string
 *           description: Deployment logs
 *         aiReviewResults:
 *           type: object
 *           description: AI code review results
 *         deploymentUrl:
 *           type: string
 *           format: uri
 *           description: Live deployment URL
 *         commitHash:
 *           type: string
 *           description: Git commit hash
 *         branch:
 *           type: string
 *           description: Git branch
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Deployment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     CreateDeploymentRequest:
 *       type: object
 *       required:
 *         - projectId
 *       properties:
 *         projectId:
 *           type: string
 *           description: Project ID to deploy
 *         branch:
 *           type: string
 *           default: main
 *           description: Git branch to deploy
 *         commitHash:
 *           type: string
 *           description: Specific commit to deploy
 *     
 *     UpdateDeploymentStatusRequest:
 *       type: object
 *       required:
 *         - deploymentId
 *         - status
 *       properties:
 *         deploymentId:
 *           type: string
 *           description: Deployment ID
 *         status:
 *           type: string
 *           enum: [pending, building, deploying, deployed, failed, cancelled]
 *           description: New deployment status
 *         logs:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional logs
 * 
 * tags:
 *   - name: Deployments
 *     description: Deployment management operations
 */

const express = require("express");
const { createDeployment, getDeployments, updateDeploymentStatus, updateDeploymentStep, deleteDeployment, redeployDeployment, overrideAiReview } = require("../controllers/deployController");
const { authenticate } = require("../middleware/auth");
const { validateDeployment, sanitizeBody } = require("../utils/validation");

const router = express.Router();

// Use authenticate as protect for consistency
const protect = authenticate;

/**
 * @swagger
 * /api/deploy:
 *   post:
 *     summary: Create a new deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeploymentRequest'
 *     responses:
 *       201:
 *         description: Deployment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deployment:
 *                       $ref: '#/components/schemas/Deployment'
 *                 message:
 *                   type: string
 *                   example: Deployment created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get all user deployments
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deployments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deployments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Deployment'
 *                 message:
 *                   type: string
 *                   example: Deployments retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", protect, sanitizeBody, validateDeployment, createDeployment);

router.get("/", protect, getDeployments);

/**
 * @swagger
 * /api/deploy/{id}:
 *   get:
 *     summary: Get deployment by ID
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Deployment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Deployment'
 *                 message:
 *                   type: string
 *                   example: Deployment fetched successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", protect, async (req, res) => {
    try {
        const Deployment = require("../models/Deployment");
        const deployment = await Deployment.findById(req.params.id).populate("projectId", "name subdomain");
        if (!deployment) {
            return res.apiNotFound("Deployment");
        }
        return res.apiSuccess(deployment, "Deployment fetched successfully");
    } catch (err) {
        return res.apiServerError("Error fetching deployment", err.message);
    }
});

/**
 * @swagger
 * /api/deploy/update-status:
 *   post:
 *     summary: Update deployment status
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeploymentStatusRequest'
 *     responses:
 *       200:
 *         description: Deployment status updated successfully
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
 *                   example: Deployment status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/update-status", protect, updateDeploymentStatus);

/**
 * @swagger
 * /api/deploy/update-step:
 *   post:
 *     summary: Update deployment step
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deploymentId
 *               - step
 *             properties:
 *               deploymentId:
 *                 type: string
 *                 description: Deployment ID
 *               step:
 *                 type: string
 *                 description: Current deployment step
 *     responses:
 *       200:
 *         description: Deployment step updated successfully
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
 *                   example: Deployment step updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/update-step", protect, updateDeploymentStep);

/**
 * @swagger
 * /api/deploy/{id}:
 *   delete:
 *     summary: Delete deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Deployment deleted successfully
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
 *                   example: Deployment deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", protect, deleteDeployment);

/**
 * @swagger
 * /api/deploy/{id}/redeploy:
 *   post:
 *     summary: Redeploy a previous deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID to redeploy
 *     responses:
 *       201:
 *         description: Redeployment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deployment:
 *                       $ref: '#/components/schemas/Deployment'
 *                 message:
 *                   type: string
 *                   example: Redeployment initiated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/redeploy", protect, redeployDeployment);

/**
 * @swagger
 * /api/deploy/{deploymentId}/override-ai-review:
 *   post:
 *     summary: Override AI review manual_review status and continue deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID to override AI review for
 *     responses:
 *       200:
 *         description: AI review overridden successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deploymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: AI review override successful
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:deploymentId/override-ai-review", protect, overrideAiReview);

// Update deployment with AI review results
router.post('/ai-results', protect, async (req, res) => {
    try {
        const { deploymentId, aiReviewResults } = req.body;

        if (!deploymentId || !aiReviewResults) {
            return res.status(400).json({
                success: false,
                message: 'Deployment ID and AI review results are required'
            });
        }

        const Deployment = require('../models/Deployment');
        const deployment = await Deployment.findByIdAndUpdate(
            deploymentId,
            { aiReviewResults },
            { new: true }
        );

        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        res.json({
            success: true,
            message: 'AI review results updated successfully',
            data: deployment
        });

    } catch (error) {
        console.error('Error updating AI review results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update AI review results'
        });
    }
});

// Update deployment with commit information
router.patch('/:deploymentId', protect, async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { commitHash, commitMessage, author, commitDate } = req.body;

        const Deployment = require('../models/Deployment');
        const deployment = await Deployment.findByIdAndUpdate(
            deploymentId,
            {
                commitHash,
                commitMessage,
                'metadata.author': author,
                'metadata.commitDate': commitDate
            },
            { new: true }
        );

        if (!deployment) {
            return res.status(404).json({
                success: false,
                message: 'Deployment not found'
            });
        }

        res.json({
            success: true,
            message: 'Deployment updated successfully',
            data: deployment
        });

    } catch (error) {
        console.error('Error updating deployment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deployment'
        });
    }
});

module.exports = router;

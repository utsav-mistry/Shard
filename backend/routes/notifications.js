/**
 * @fileoverview Notification Routes
 * @description Express routes for handling notification-related endpoints
 * @module routes/notifications
 * @requires express
 * @requires ../controllers/notificationController
 * @requires ../middleware/auth
 * @author Utsav Mistry
 * @version 1.0.0
 */

const express = require('express');
const { 
    sendDeploymentNotification, 
    sendWelcomeEmail, 
    testEmailConfig 
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/notifications/deployment
 * @description Send deployment status notification email
 * @access Public (called by deployment worker)
 * @param {Object} req.body - Notification data
 * @param {string} req.body.userEmail - Recipient email
 * @param {string} req.body.projectId - Project ID
 * @param {string} req.body.status - Deployment status
 */
router.post('/deployment', sendDeploymentNotification);

/**
 * @route POST /api/notifications/welcome
 * @description Send welcome email to new user
 * @access Public (called during registration)
 * @param {Object} req.body - User data
 * @param {string} req.body.email - User email
 * @param {string} req.body.name - User name
 */
router.post('/welcome', sendWelcomeEmail);

/**
 * @route GET /api/notifications/test
 * @description Test email configuration
 * @access Private (requires authentication)
 * @middleware authenticate
 */
router.get('/test', authenticate, testEmailConfig);

/**
 * @namespace notificationRoutes
 * @description Express router for notification endpoints
 */
module.exports = router;

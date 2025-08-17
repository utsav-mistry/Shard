const express = require('express');
const { 
    sendDeploymentNotification, 
    sendWelcomeEmail, 
    testEmailConfig 
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Send deployment notification
router.post('/deployment', sendDeploymentNotification);

// Send welcome email
router.post('/welcome', sendWelcomeEmail);

// Test email configuration (protected route)
router.get('/test', authenticate, testEmailConfig);

module.exports = router;

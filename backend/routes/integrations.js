const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const integrationsController = require('../controllers/integrationsController');

// All integration routes require authentication
router.use(authenticate);

// GitHub Integration Routes (for repository scanning)
router.get('/github/connect', integrationsController.initiateGitHubIntegration);
router.post('/github/callback', integrationsController.handleGitHubIntegrationCallback);
router.get('/github/repositories', integrationsController.getGitHubRepositories);
router.post('/github/disconnect', integrationsController.disconnectGitHub);
router.get('/github/status', integrationsController.getGitHubIntegrationStatus);

module.exports = router;

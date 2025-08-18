const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const integrationsController = require('../controllers/integrationsController');

// GitHub Callback is public as it's called by GitHub
router.get('/github/callback', integrationsController.handleGitHubIntegrationCallback);

// All other integration routes require authentication
router.use(authenticate);

// GitHub Integration Routes (for repository scanning)
router.get('/github/connect', integrationsController.initiateGitHubIntegration);
router.get('/github/repositories', integrationsController.getGitHubRepositories);
router.get('/github/repositories/:repo/contents', integrationsController.getRepositoryContents);
router.post('/github/disconnect', integrationsController.disconnectGitHub);
router.get('/github/status', integrationsController.getGitHubIntegrationStatus);

module.exports = router;

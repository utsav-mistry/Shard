const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

// GitHub OAuth flow
router.get('/auth', githubController.initiateAuth);
router.get('/auth/callback', githubController.handleCallback);

// Repository operations
router.get('/repos', authenticate, githubController.listRepos);
router.get('/repos/:owner/:repo', authenticate, githubController.getRepo);
router.get('/repos/:owner/:repo/contents', authenticate, githubController.listRepoContents);
router.get('/repos/:owner/:repo/branches', authenticate, githubController.listBranches);

// Deployment setup
router.post('/setup-deployment', authenticate, githubController.setupDeployment);

module.exports = router;

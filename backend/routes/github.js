const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

// GitHub OAuth flow
router.get('/auth/github', githubController.initiateAuth);
router.get('/auth/github/callback', githubController.handleCallback);

// Repository operations
router.get('/github/repos', authenticate, githubController.listRepos);
router.get('/github/repos/:owner/:repo', authenticate, githubController.getRepo);
router.get('/github/repos/:owner/:repo/contents', authenticate, githubController.listRepoContents);
router.get('/github/repos/:owner/:repo/branches', authenticate, githubController.listBranches);

// Deployment setup
router.post('/github/deploy', authenticate, githubController.setupDeployment);

module.exports = router;

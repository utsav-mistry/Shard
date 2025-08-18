const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

// GitHub OAuth flow
router.get('/auth', githubController.initiateAuth);
router.get('/auth/callback', githubController.handleCallback);

// GitHub integration status and connection
router.get('/status', authenticate, githubController.getStatus);
router.get('/connect', authenticate, (req, res) => {
    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/integration/callback`;
    
    // Store user ID with state for integration callback
    const { cache } = require('../services/cacheService');
    cache.set(`github:integration:${state}`, { userId: req.user.id }, 600); // 10 min TTL
    
    res.json({
        success: true,
        data: {
            authUrl: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=repo,user:email`
        }
    });
});

// GitHub integration callback (separate from auth callback)
router.get('/integration/callback', githubController.handleIntegrationCallback);

// Repository operations
router.get('/repos', authenticate, githubController.listRepos);
router.get('/repos/:owner/:repo', authenticate, githubController.getRepo);
router.get('/repos/:owner/:repo/contents', authenticate, githubController.listRepoContents);
router.get('/repos/:owner/:repo/branches', authenticate, githubController.listBranches);

// Deployment setup
router.post('/setup-deployment', authenticate, githubController.setupDeployment);

module.exports = router;

/**
 * @fileoverview GitHub Routes
 * @description Express routes for GitHub OAuth integration and repository operations
 * @module routes/github
 * @requires express
 * @requires ../controllers/githubController
 * @requires ../middleware/auth
 * @requires ../services/cacheService
 * @author Utsav Mistry
 * @version 0.0.1
 */

const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/github/auth
 * @description Initiate GitHub OAuth authentication flow
 * @access Public
 */
router.get('/auth', githubController.initiateAuth);

/**
 * @route GET /api/github/auth/callback
 * @description Handle GitHub OAuth callback
 * @access Public
 */
router.get('/auth/callback', githubController.handleCallback);

/**
 * @route GET /api/github/status
 * @description Get GitHub integration status for authenticated user
 * @access Private
 * @middleware authenticate
 */
router.get('/status', authenticate, githubController.getStatus);
/**
 * @route GET /api/github/connect
 * @description Generate GitHub integration connection URL
 * @access Private
 * @middleware authenticate
 */
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

/**
 * @route GET /api/github/integration/callback
 * @description Handle GitHub integration callback (separate from auth)
 * @access Public
 */
router.get('/integration/callback', githubController.handleIntegrationCallback);

/**
 * @route GET /api/github/repos
 * @description List user's GitHub repositories
 * @access Private
 * @middleware authenticate
 */
router.get('/repos', authenticate, githubController.listRepos);

/**
 * @route GET /api/github/repos/:owner/:repo
 * @description Get specific repository details
 * @access Private
 * @middleware authenticate
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
router.get('/repos/:owner/:repo', authenticate, githubController.getRepo);

/**
 * @route GET /api/github/repos/:owner/:repo/contents
 * @description List repository contents
 * @access Private
 * @middleware authenticate
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
router.get('/repos/:owner/:repo/contents', authenticate, githubController.listRepoContents);

/**
 * @route GET /api/github/repos/:owner/:repo/branches
 * @description List repository branches
 * @access Private
 * @middleware authenticate
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
router.get('/repos/:owner/:repo/branches', authenticate, githubController.listBranches);

/**
 * @route POST /api/github/setup-deployment
 * @description Setup deployment for GitHub repository
 * @access Private
 * @middleware authenticate
 */
router.post('/setup-deployment', authenticate, githubController.setupDeployment);

/**
 * @namespace githubRoutes
 * @description Express router for GitHub integration and repository management
 */
module.exports = router;

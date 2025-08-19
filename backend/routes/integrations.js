/**
 * @swagger
 * components:
 *   schemas:
 *     GitHubRepository:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: GitHub repository ID
 *         name:
 *           type: string
 *           description: Repository name
 *         full_name:
 *           type: string
 *           description: Full repository name (owner/repo)
 *         description:
 *           type: string
 *           description: Repository description
 *         private:
 *           type: boolean
 *           description: Whether repository is private
 *         html_url:
 *           type: string
 *           description: Repository URL
 *         clone_url:
 *           type: string
 *           description: Repository clone URL
 *         default_branch:
 *           type: string
 *           description: Default branch name
 *         language:
 *           type: string
 *           description: Primary programming language
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     RepositoryContent:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: File or directory name
 *         path:
 *           type: string
 *           description: Full path in repository
 *         type:
 *           type: string
 *           enum: [file, dir]
 *           description: Content type
 *         size:
 *           type: number
 *           description: File size in bytes
 *         download_url:
 *           type: string
 *           description: Direct download URL for files
 *     
 *     GitHubIntegrationStatus:
 *       type: object
 *       properties:
 *         connected:
 *           type: boolean
 *           description: Whether GitHub integration is connected
 *         username:
 *           type: string
 *           description: Connected GitHub username
 *         connectedAt:
 *           type: string
 *           format: date-time
 *           description: Connection timestamp
 * 
 * tags:
 *   - name: Integrations
 *     description: Third-party integration operations
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const integrationsController = require('../controllers/integrationsController');

/**
 * @swagger
 * /api/integrations/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: Handle GitHub OAuth callback for repository integration (public endpoint)
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from GitHub
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter
 *     responses:
 *       302:
 *         description: Redirect to frontend with integration result
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       500:
 *         description: Internal server error during OAuth process
 */
// GitHub Callback is public as it's called by GitHub
router.get('/github/callback', integrationsController.handleGitHubIntegrationCallback);

// All other integration routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/integrations/github/connect:
 *   get:
 *     summary: Initiate GitHub integration
 *     description: Start the GitHub OAuth flow for repository integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth authorization
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GitHub Integration Routes (for repository scanning)
router.get('/github/connect', integrationsController.initiateGitHubIntegration);

/**
 * @swagger
 * /api/integrations/github/repositories:
 *   get:
 *     summary: Get GitHub repositories
 *     description: Retrieve all accessible GitHub repositories for the authenticated user
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repositories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GitHubRepository'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: GitHub integration not connected
 *       500:
 *         description: Failed to fetch repositories
 */
router.get('/github/repositories', integrationsController.getGitHubRepositories);

/**
 * @swagger
 * /api/integrations/github/repositories/{repo}/contents:
 *   get:
 *     summary: Get repository contents
 *     description: Retrieve contents of a specific GitHub repository
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: repo
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository name (owner/repo format)
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *           default: ''
 *         description: Path within repository to explore
 *     responses:
 *       200:
 *         description: Repository contents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RepositoryContent'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: GitHub integration not connected or repository access denied
 *       404:
 *         description: Repository or path not found
 *       500:
 *         description: Failed to fetch repository contents
 */
router.get('/github/repositories/:repo/contents', integrationsController.getRepositoryContents);

/**
 * @swagger
 * /api/integrations/github/disconnect:
 *   post:
 *     summary: Disconnect GitHub integration
 *     description: Remove GitHub integration and revoke access tokens
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub integration disconnected successfully
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
 *                   example: GitHub integration disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to disconnect GitHub integration
 */
router.post('/github/disconnect', integrationsController.disconnectGitHub);

/**
 * @swagger
 * /api/integrations/github/status:
 *   get:
 *     summary: Get GitHub integration status
 *     description: Check the current status of GitHub integration for the authenticated user
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GitHubIntegrationStatus'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/github/status', integrationsController.getGitHubIntegrationStatus);

module.exports = router;

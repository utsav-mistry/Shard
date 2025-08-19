/**
 * @fileoverview GitHub Controller
 * @description Handles GitHub OAuth integration, repository operations, and deployment setup
 *              for seamless GitHub-based project imports in the Shard platform
 * @author Utsav Mistry
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const githubService = require('../services/githubService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const { cache } = require('../services/cacheService');

/**
 * Get GitHub integration connection status for authenticated user
 * @function getStatus
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} [req.user.githubIntegrationToken] - GitHub integration access token
 * @param {string} [req.user.githubIntegrationUsername] - GitHub username
 * @param {string} [req.user.githubIntegrationId] - GitHub user ID
 * @param {Object} res - Express response object
 * @returns {void} Returns connection status and user GitHub information
 * @description Checks if user has connected GitHub integration for repository access
 * @note Uses separate integration fields (not auth fields) for GitHub operations
 * @note Returns avatar URL from user profile or generates GitHub avatar URL
 * @example
 * // GET /api/github/status
 * // Returns: { success: true, data: { connected: true, username: "user", ... } }
 */
exports.getStatus = (req, res) => {
    try {
        const { githubIntegrationToken, githubIntegrationUsername, githubIntegrationId } = req.user;
        
        if (!githubIntegrationToken || !githubIntegrationUsername) {
            return res.json({
                success: true,
                data: {
                    connected: false
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                connected: true,
                username: githubIntegrationUsername,
                id: githubIntegrationId,
                avatar: req.user.avatar || `https://github.com/${githubIntegrationUsername}.png`
            }
        });
    } catch (error) {
        console.error('Error getting GitHub status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get GitHub status'
        });
    }
};

/**
 * Initiate GitHub OAuth flow for repository integration
 * @function initiateAuth
 * @param {Object} req - Express request object
 * @param {string} [req.query.state] - Base64 encoded state with user token
 * @param {Object} [req.user] - Authenticated user object (fallback)
 * @param {Object} res - Express response object
 * @returns {void} Redirects to GitHub OAuth authorization URL
 * @throws {AuthError} When no authentication provided or token invalid
 * @description Starts GitHub OAuth flow with CSRF protection using state parameter
 * @note Supports both token-in-state and session-based authentication
 * @note Caches user ID with state for callback verification (10 min TTL)
 * @note Requests 'repo' and 'user:email' scopes for full repository access
 * @security Uses UUID state parameter to prevent CSRF attacks
 * @example
 * // GET /api/github/auth?state=base64EncodedToken
 * // Redirects to: https://github.com/login/oauth/authorize?client_id=...
 */
exports.initiateAuth = (req, res) => {
    try {
        const state = req.query.state || uuidv4();
        const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/auth/callback`;
        
        try {
            // If state is provided, it contains the user's token
            if (req.query.state) {
                const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
                if (stateData.token) {
                    // Verify the token is valid
                    const decoded = jwt.verify(stateData.token, process.env.JWT_SECRET);
                    // Store user ID in cache with state
                    cache.set(`github:state:${state}`, { userId: decoded.id }, 600); // 10 min TTL
                }
            } else if (req.user?.id) {
                // Fallback to session user if available
                cache.set(`github:state:${state}`, { userId: req.user.id }, 600);
            } else {
                throw new Error('No authentication provided');
            }
        } catch (error) {
            logger.error('State validation failed:', error);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/integrations/github?error=auth_required`);
        }
        
        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.append('client_id', process.env.GITHUB_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', 'repo,user:email');
        
        res.redirect(authUrl.toString());
    } catch (error) {
        logger.error('GitHub auth initiation failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate GitHub authentication' 
        });
    }
};

/**
 * Handle GitHub OAuth callback and store integration credentials
 * @async
 * @function handleCallback
 * @param {Object} req - Express request object
 * @param {string} req.query.code - OAuth authorization code from GitHub
 * @param {string} req.query.state - State parameter for CSRF protection
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Redirects to frontend with success/error status
 * @throws {AuthError} When state is invalid or expired
 * @throws {OAuthError} When token exchange fails
 * @description Completes GitHub OAuth flow and stores integration token
 * @note Exchanges authorization code for access token
 * @note Updates user record with GitHub integration credentials
 * @note Cleans up state cache after successful verification
 * @security Validates state parameter to prevent CSRF attacks
 * @example
 * // GET /api/github/callback?code=abc123&state=xyz789
 * // Redirects to: /app/integrations/github?success=true
 */
exports.handleCallback = async (req, res) => {
    const { code, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    try {
        // Verify state to prevent CSRF
        const stateData = cache.get(`github:state:${state}`);
        if (!stateData || !stateData.userId) {
            logger.error('Invalid or expired state:', { state, stateData });
            return res.redirect(`${frontendUrl}/app/integrations/github?error=invalid_state`);
        }
        
        const userId = stateData.userId;
        cache.del(`github:state:${state}`); // Clean up state after use
        
        // Exchange code for access token
        const accessToken = await githubService.getAccessToken(code);
        const githubUser = await githubService.getGitHubUser(accessToken);
        
        // Update user with GitHub credentials
        const User = require('../models/User');
        await User.findByIdAndUpdate(userId, {
            githubIntegrationToken: accessToken,
            githubIntegrationUsername: githubUser.login,
            githubIntegrationId: githubUser.id.toString(),
            avatar: githubUser.avatar_url
        });
        
        logger.info('Updated user with GitHub integration credentials:', {
            userId,
            githubIntegrationUsername: githubUser.login,
            githubIntegrationId: githubUser.id
        });
        
        // Redirect to frontend with success state
        res.redirect(`${frontendUrl}/app/integrations/github?success=true`);
    } catch (error) {
        logger.error('GitHub OAuth callback failed:', error);
        res.redirect(`${frontendUrl}/app/integrations/github?error=auth_failed`);
    }
};

/**
 * List authenticated user's GitHub repositories with pagination
 * @async
 * @function listRepos
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.githubAccessToken - GitHub access token for API calls
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.perPage=30] - Number of repositories per page
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns paginated list of user repositories
 * @throws {BadRequestError} When GitHub integration is not connected
 * @throws {ServerError} When GitHub API request fails
 * @description Fetches user's GitHub repositories for project import selection
 * @note Requires GitHub integration to be connected first
 * @note Supports pagination for handling large repository lists
 * @note Used by project creation flow for repository selection
 * @example
 * // GET /api/github/repos?page=1&perPage=10
 * // Returns: { success: true, data: [repo1, repo2, ...] }
 */
exports.listRepos = async (req, res) => {
    try {
        const { githubAccessToken } = req.user;
        const { page = 1, perPage = 30 } = req.query;
        
        if (!githubAccessToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'GitHub not connected. Please connect your GitHub account first.' 
            });
        }
        
        const repos = await githubService.listUserRepos(githubAccessToken, { 
            page: parseInt(page), 
            perPage: parseInt(perPage) 
        });
        
        res.json({ success: true, data: repos });
    } catch (error) {
        logger.error('Failed to list GitHub repositories:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch GitHub repositories' 
        });
    }
};

/**
 * Get detailed information for a specific GitHub repository
 * @async
 * @function getRepo
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.githubAccessToken - GitHub access token
 * @param {string} req.params.owner - Repository owner username
 * @param {string} req.params.repo - Repository name
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns detailed repository information
 * @throws {ServerError} When GitHub API request fails or repository not found
 * @description Fetches comprehensive repository data including metadata and settings
 * @note Used for project import validation and configuration
 * @note Returns repository details like description, language, default branch
 * @example
 * // GET /api/github/repos/owner/repo-name
 * // Returns: { success: true, data: { name, description, language, ... } }
 */
exports.getRepo = async (req, res) => {
    try {
        const { githubAccessToken } = req.user;
        const { owner, repo } = req.params;
        
        const repoData = await githubService.getRepo(githubAccessToken, owner, repo);
        res.json({ success: true, data: repoData });
    } catch (error) {
        logger.error(`Failed to fetch repository ${owner}/${repo}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch repository details' 
        });
    }
};

/**
 * List contents of a GitHub repository directory
 * @async
 * @function listRepoContents
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.githubAccessToken - GitHub access token
 * @param {string} req.params.owner - Repository owner username
 * @param {string} req.params.repo - Repository name
 * @param {string} [req.query.path=''] - Directory path to list (empty for root)
 * @param {string} [req.query.ref='main'] - Git reference (branch/tag/commit)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns array of files and directories
 * @throws {ServerError} When GitHub API request fails
 * @description Lists repository contents for file browser and project structure analysis
 * @note Supports browsing any directory within the repository
 * @note Can specify branch, tag, or commit hash via ref parameter
 * @note Used for project setup and configuration file detection
 * @example
 * // GET /api/github/repos/owner/repo/contents?path=src&ref=develop
 * // Returns: { success: true, data: [file1, dir1, ...] }
 */
exports.listRepoContents = async (req, res) => {
    try {
        const { githubAccessToken } = req.user;
        const { owner, repo } = req.params;
        const { path = '', ref = 'main' } = req.query;
        
        const contents = await githubService.listRepoContents(
            githubAccessToken, 
            owner, 
            repo, 
            path,
            ref
        );
        
        res.json({ success: true, data: contents });
    } catch (error) {
        logger.error(`Failed to list contents of ${owner}/${repo}/${path}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to list repository contents' 
        });
    }
};

/**
 * List all branches for a GitHub repository
 * @async
 * @function listBranches
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.githubAccessToken - GitHub access token
 * @param {string} req.params.owner - Repository owner username
 * @param {string} req.params.repo - Repository name
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns array of repository branches
 * @throws {ServerError} When GitHub API request fails
 * @description Fetches all branches for branch selection during project setup
 * @note Used in project creation flow for branch selection
 * @note Returns branch names and commit information
 * @note Helps users choose deployment branch for their project
 * @example
 * // GET /api/github/repos/owner/repo/branches
 * // Returns: { success: true, data: [{ name: "main", commit: {...} }, ...] }
 */
exports.listBranches = async (req, res) => {
    try {
        const { githubAccessToken } = req.user;
        const { owner, repo } = req.params;
        
        const branches = await githubService.listBranches(githubAccessToken, owner, repo);
        res.json({ success: true, data: branches });
    } catch (error) {
        logger.error(`Failed to list branches for ${owner}/${repo}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch repository branches' 
        });
    }
};

/**
 * Set up new project deployment from GitHub repository
 * @async
 * @function setupDeployment
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.githubAccessToken - GitHub access token
 * @param {string} req.user.id - User ID for project ownership
 * @param {string} req.body.owner - Repository owner username
 * @param {string} req.body.repo - Repository name
 * @param {string} [req.body.branch='main'] - Deployment branch
 * @param {string} [req.body.rootDir=''] - Root directory for deployment
 * @param {string} req.body.projectName - Project name for Shard platform
 * @param {string} req.body.framework - Framework type (mern, flask, django)
 * @param {Array} [req.body.envVars=[]] - Environment variables array
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Returns project and deployment information
 * @throws {ValidationError} When required fields are missing
 * @throws {NotFoundError} When repository is not accessible
 * @throws {ServerError} When project creation or deployment fails
 * @description Creates new project from GitHub repository and triggers initial deployment
 * @note Validates repository access before project creation
 * @note Generates unique subdomain with random words
 * @note Sets up environment variables with encryption for secrets
 * @note Triggers initial deployment automatically after project creation
 * @example
 * // POST /api/github/setup-deployment
 * // Body: { owner: "user", repo: "app", projectName: "My App", framework: "mern" }
 * // Returns: { success: true, data: { projectId, deploymentId, subdomain, ... } }
 */
exports.setupDeployment = async (req, res) => {
    try {
        const { githubAccessToken, id: userId } = req.user;
        const { 
            owner, 
            repo, 
            branch = 'main', 
            rootDir = '', 
            projectName, 
            framework,
            envVars = [] 
        } = req.body;
        
        // Validate required fields
        if (!owner || !repo || !projectName || !framework) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: owner, repo, projectName, framework'
            });
        }
        
        if (!githubAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'GitHub not connected. Please connect your GitHub account first.'
            });
        }
        
        // Verify repository access
        const repoData = await githubService.getRepo(githubAccessToken, owner, repo);
        if (!repoData) {
            return res.status(404).json({
                success: false,
                message: 'Repository not found or access denied'
            });
        }
        
        // Generate custom subdomain with random words
        const customWords = ['swift', 'bright', 'cosmic', 'stellar', 'quantum', 'nexus', 'prime', 'alpha', 'beta', 'gamma', 'delta', 'omega'];
        const randomWord = customWords[Math.floor(Math.random() * customWords.length)];
        const subdomain = `${projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${randomWord}-on`;
        
        // Create project in database
        const project = new Project({
            ownerId: userId,
            name: projectName,
            repoUrl: repoData.clone_url,
            stack: framework,
            subdomain: subdomain,
            settings: {
                envVars: envVars.map(({ key, value, isSecret = false }) => ({
                    key,
                    value: isSecret ? encryptValue(value) : value,
                    isSecret
                })),
                buildCommand: getDefaultBuildCommand(framework),
                startCommand: getDefaultStartCommand(framework),
            },
            metadata: {
                githubOwner: owner,
                githubRepo: repo,
                githubBranch: branch,
                githubRootDir: rootDir,
            }
        });
        
        await project.save();
        
        // Trigger initial deployment with proper integration
        const deploymentController = require('./deployController');
        const deploymentResult = await deploymentController.createDeploymentFromProject({
            projectId: project._id,
            userId: userId,
            branch: branch,
            commitHash: repoData.default_branch === branch ? 'HEAD' : branch,
            message: `Initial deployment from ${owner}/${repo}`,
            envVars: envVars
        });
        
        res.json({
            success: true,
            message: 'Project imported and deployment initiated',
            data: {
                projectId: project._id,
                projectName: project.name,
                subdomain: project.subdomain,
                deploymentId: deploymentResult.deploymentId,
                customDomain: getCustomDomain(framework, subdomain),
                status: 'pending'
            }
        });
        
    } catch (error) {
        logger.error('Deployment setup failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to set up deployment',
            error: error.message
        });
    }
};

/**
 * Get default build command for specified framework
 * @private
 * @function getDefaultBuildCommand
 * @param {string} framework - Framework name (react, nextjs, node, etc.)
 * @returns {string} Default build command for the framework
 * @description Returns appropriate build command based on project framework
 * @note Supports popular frameworks with fallback to npm install
 */
function getDefaultBuildCommand(framework) {
    const commands = {
        'react': 'npm install && npm run build',
        'nextjs': 'npm install && npm run build',
        'node': 'npm install',
        'express': 'npm install',
        'vue': 'npm install && npm run build',
        'angular': 'npm install && npm run build --prod',
        'django': 'pip install -r requirements.txt',
        'flask': 'pip install -r requirements.txt',
    };
    
    return commands[framework.toLowerCase()] || 'npm install';
}

/**
 * Get default start command for specified framework
 * @private
 * @function getDefaultStartCommand
 * @param {string} framework - Framework name (react, nextjs, node, etc.)
 * @returns {string} Default start command for the framework
 * @description Returns appropriate start command based on project framework
 * @note Supports popular frameworks with fallback to npm start
 */
function getDefaultStartCommand(framework) {
    const commands = {
        'react': 'npm start',
        'nextjs': 'npm start',
        'node': 'node index.js',
        'express': 'node app.js',
        'vue': 'npm run serve',
        'angular': 'ng serve',
        'django': 'python manage.py runserver',
        'flask': 'python app.py',
    };
    
    return commands[framework.toLowerCase()] || 'npm start';
}

/**
 * Encrypt sensitive environment variable values
 * @private
 * @function encryptValue
 * @param {string} value - Plain text value to encrypt
 * @returns {string} Base64 encoded encrypted value
 * @description Basic encryption for environment variable values
 * @note This is a simple base64 encoding - use proper encryption in production
 * @todo Implement proper encryption using crypto module
 */
function encryptValue(value) {
    // In a real app, use proper encryption
    return Buffer.from(value).toString('base64');
}

/**
 * Generate custom domain URL for deployed project
 * @private
 * @function getCustomDomain
 * @param {string} framework - Project framework (mern, django, flask)
 * @param {string} subdomain - Project subdomain
 * @returns {string} Custom domain URL for the deployed project
 * @description Generates appropriate URL based on framework port configuration
 * @note Uses predefined port mapping for different tech stacks
 * @note Returns localhost URLs for development environment
 */
function getCustomDomain(framework, subdomain) {
    const PORT_CONFIG = {
        mern: { backend: 12000 },
        django: { backend: 13000 },
        flask: { backend: 14000 },
    };
    
    const ports = PORT_CONFIG[framework.toLowerCase()];
    if (!ports) {
        return `http://localhost:3000`; // fallback
    }
    
    if (framework.toLowerCase() === 'mern' && ports.frontend) {
        return `http://localhost:${ports.frontend}`;
    }
    
    return `http://localhost:${ports.backend}`;
}

/**
 * Handle GitHub integration callback for repository access (separate from auth)
 * @async
 * @function handleIntegrationCallback
 * @param {Object} req - Express request object
 * @param {string} req.query.code - OAuth authorization code from GitHub
 * @param {string} req.query.state - State parameter for integration flow
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Redirects to integrations page with status
 * @throws {AuthError} When integration state is invalid or expired
 * @throws {OAuthError} When token exchange fails
 * @description Handles OAuth callback specifically for GitHub integration (not login)
 * @note Separate from authentication callback - used only for repository access
 * @note Updates user with integration-specific GitHub credentials
 * @note Uses different cache key pattern for integration state
 * @security Validates integration state to prevent CSRF attacks
 * @example
 * // GET /api/github/integration/callback?code=abc123&state=integration-xyz
 * // Redirects to: /app/integrations?github_connected=true
 */
exports.handleIntegrationCallback = async (req, res) => {
    const { code, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    try {
        // Verify state for integration flow
        const stateData = cache.get(`github:integration:${state}`);
        if (!stateData || !stateData.userId) {
            logger.error('Invalid or expired integration state:', { state, stateData });
            return res.redirect(`${frontendUrl}/app/integrations?error=invalid_state`);
        }
        
        const userId = stateData.userId;
        cache.del(`github:integration:${state}`); // Clean up state after use
        
        // Exchange code for access token
        const accessToken = await githubService.getAccessToken(code);
        const githubUser = await githubService.getGitHubUser(accessToken);
        
        // Update user with GitHub credentials
        const User = require('../models/User');
        await User.findByIdAndUpdate(userId, {
            githubIntegrationToken: accessToken,
            githubIntegrationUsername: githubUser.login,
            githubIntegrationId: githubUser.id.toString(),
            avatar: githubUser.avatar_url
        });
        
        logger.info('Updated user with GitHub integration credentials:', {
            userId,
            githubIntegrationUsername: githubUser.login,
            githubIntegrationId: githubUser.id
        });
        
        // Redirect to integrations page with success
        res.redirect(`${frontendUrl}/app/integrations?github_connected=true`);
    } catch (error) {
        logger.error('GitHub integration callback failed:', error);
        res.redirect(`${frontendUrl}/app/integrations?error=integration_failed`);
    }
};

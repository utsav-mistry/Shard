const jwt = require('jsonwebtoken');
const githubService = require('../services/githubService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const { cache } = require('../services/cacheService');

/**
 * Get GitHub connection status for the current user
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
 * Initiate GitHub OAuth flow
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
 * Handle GitHub OAuth callback
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
 * List user's GitHub repositories
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
 * Get repository details
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
 * List repository contents
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
 * List repository branches
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
 * Set up a new deployment from GitHub repository
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

// Helper functions
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

function encryptValue(value) {
    // In a real app, use proper encryption
    return Buffer.from(value).toString('base64');
}

function getCustomDomain(framework, subdomain) {
    const PORT_CONFIG = {
        mern: { backend: 12000, frontend: 12001 },
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
 * Handle GitHub integration callback (separate from auth login)
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

const githubService = require('../services/githubService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const { cache } = require('../services/cacheService');

/**
 * Initiate GitHub OAuth flow
 */
exports.initiateAuth = (req, res) => {
    try {
        const state = uuidv4();
        const redirectUri = `${process.env.BACKEND_URL}/api/github/auth/callback`;
        
        // Store state in cache for validation in callback
        cache.set(`github:state:${state}`, { userId: req.user?.id }, 600); // 10 min TTL
        
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
        if (!stateData) {
            return res.redirect(`${frontendUrl}/integrations/github?error=invalid_state`);
        }
        
        // Exchange code for access token
        const accessToken = await githubService.getAccessToken(code);
        const githubUser = await githubService.getGitHubUser(accessToken);
        
        // Store GitHub token in user's session or database
        // In a real app, you'd save this to the user's profile
        const sessionData = {
            githubAccessToken: accessToken,
            githubUsername: githubUser.login,
            githubId: githubUser.id,
            userId: stateData.userId,
        };
        
        // Store in cache for 1 hour
        cache.set(`github:session:${state}`, sessionData, 3600);
        
        // Redirect to frontend with success state
        res.redirect(`${frontendUrl}/integrations/github/callback?state=${state}`);
    } catch (error) {
        logger.error('GitHub OAuth callback failed:', error);
        res.redirect(`${frontendUrl}/integrations/github?error=auth_failed`);
    }
};

/**
 * List user's GitHub repositories
 */
exports.listRepos = async (req, res) => {
    try {
        const { githubAccessToken } = req.user; // Assuming this is set by auth middleware
        const { page = 1, perPage = 30 } = req.query;
        
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
        
        // Verify repository access
        const repoData = await githubService.getRepo(githubAccessToken, owner, repo);
        if (!repoData) {
            return res.status(404).json({
                success: false,
                message: 'Repository not found or access denied'
            });
        }
        
        // Create project in database
        const project = new Project({
            ownerId: userId,
            name: projectName,
            repoUrl: repoData.url,
            stack: framework,
            subdomain: `${projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${Date.now()}`,
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
        
        // Trigger initial deployment (async)
        project.triggerDeployment(userId, branch)
            .catch(err => {
                logger.error(`Initial deployment failed for project ${project._id}:`, err);
            });
        
        res.json({
            success: true,
            message: 'Deployment setup initiated',
            data: {
                projectId: project._id,
                projectName: project.name,
                subdomain: project.subdomain,
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

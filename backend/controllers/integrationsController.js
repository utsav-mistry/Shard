const User = require('../models/User');
const githubService = require('../services/githubService');
const querystring = require('querystring');

// GitHub Integration URLs
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

// Initiate GitHub Integration (for repository access)
const initiateGitHubIntegration = async (req, res) => {
    try {
        const state = Math.random().toString(36).substring(2, 15);
        
        // Store state in session or database for security
        req.session = req.session || {};
        req.session.githubIntegrationState = state;
        
        const authUrl = new URL(GITHUB_AUTH_URL);
        authUrl.searchParams.append('client_id', process.env.GITHUB_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/integrations/github/callback`);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', 'repo,user:email'); // Repository access scope
        
        return res.apiSuccess({ authUrl: authUrl.toString() }, 'GitHub integration URL generated');
    } catch (error) {
        console.error('GitHub integration initiation error:', error);
        return res.apiServerError('Failed to initiate GitHub integration', error.message);
    }
};

// Handle GitHub Integration Callback
const handleGitHubIntegrationCallback = async (req, res) => {
    const { code, state } = req.body;
    
    if (!code) {
        return res.apiValidationError({ code: 'Authorization code is required' }, 'Missing authorization code');
    }
    
    // Verify state for security (optional but recommended)
    if (req.session?.githubIntegrationState && req.session.githubIntegrationState !== state) {
        return res.apiValidationError({ state: 'Invalid state parameter' }, 'Security validation failed');
    }
    
    try {
        // Exchange code for access token
        const accessToken = await githubService.getAccessToken(code);
        const gitHubUser = await githubService.getGitHubUser(accessToken);
        
        // Update user with GitHub integration data
        const user = req.user;
        user.githubAccessToken = accessToken; // Store encrypted in production
        user.githubUsername = gitHubUser.login;
        user.githubId = gitHubUser.id;
        if (!user.avatar) user.avatar = gitHubUser.avatar_url;
        
        await user.save();
        
        // Clear session state
        if (req.session) {
            delete req.session.githubIntegrationState;
        }
        
        return res.apiSuccess({
            connected: true,
            username: gitHubUser.login,
            avatar: gitHubUser.avatar_url
        }, 'GitHub integration successful');
        
    } catch (error) {
        console.error('GitHub integration callback error:', error);
        return res.apiServerError('GitHub integration failed', error.message);
    }
};

// Get GitHub Repositories
const getGitHubRepositories = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user.githubAccessToken) {
            return res.apiValidationError({}, 'GitHub integration not connected');
        }
        
        // Fetch repositories using GitHub service
        const repositories = await githubService.listUserRepos(user.githubAccessToken);
        
        return res.apiSuccess({ repositories }, 'Repositories fetched successfully');
        
    } catch (error) {
        console.error('GitHub repositories fetch error:', error);
        return res.apiServerError('Failed to fetch repositories', error.message);
    }
};

// Disconnect GitHub Integration
const disconnectGitHub = async (req, res) => {
    try {
        const user = req.user;
        
        // Remove GitHub integration data (keep login data)
        user.githubAccessToken = undefined;
        // Keep githubId and githubUsername for login purposes
        
        await user.save();
        
        return res.apiSuccess({ connected: false }, 'GitHub integration disconnected');
        
    } catch (error) {
        console.error('GitHub disconnect error:', error);
        return res.apiServerError('Failed to disconnect GitHub', error.message);
    }
};

// Get GitHub Integration Status
const getGitHubIntegrationStatus = async (req, res) => {
    try {
        const user = req.user;
        
        const isConnected = !!user.githubAccessToken;
        
        const status = {
            connected: isConnected,
            username: user.githubUsername || null,
            avatar: user.avatar || null
        };
        
        return res.apiSuccess(status, 'GitHub integration status retrieved');
        
    } catch (error) {
        console.error('GitHub status check error:', error);
        return res.apiServerError('Failed to check GitHub status', error.message);
    }
};

module.exports = {
    initiateGitHubIntegration,
    handleGitHubIntegrationCallback,
    getGitHubRepositories,
    disconnectGitHub,
    getGitHubIntegrationStatus
};

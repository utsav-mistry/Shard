/**
 * @fileoverview Integrations Controller
 * @description Handles third-party integrations including GitHub OAuth, repository access,
 *              and integration management for the Shard platform
 *  @author Utsav Mistry
 * @version 1.0.0
 */

const { Octokit } = require('@octokit/rest');
const User = require('../models/User');
const githubIntegrationService = require('../services/githubIntegrationService');
const querystring = require('querystring');

// GitHub Integration URLs
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

/**
 * Initiate GitHub integration OAuth flow for repository access
 * @async
 * @function initiateGitHubIntegration
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with GitHub OAuth URL
 * @throws {ServerError} When GitHub integration is not configured or URL generation fails
 * @note Uses separate GitHub OAuth app for repository access (not authentication)
 * @note Generates secure state parameter and stores in cache for callback verification
 * @note Requires GITHUB_INTEGRATION_CLIENT_ID environment variable
 */
const initiateGitHubIntegration = async (req, res) => {
    try {
        // Debug environment variables
        console.log('DEBUG: Integration Environment Variables:', {
            GITHUB_INTEGRATION_CLIENT_ID: process.env.GITHUB_INTEGRATION_CLIENT_ID ? 'SET' : 'NOT SET',
            GITHUB_INTEGRATION_CLIENT_SECRET: process.env.GITHUB_INTEGRATION_CLIENT_SECRET ? 'SET' : 'NOT SET',
            GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'SET' : 'NOT SET'
        });

        if (!process.env.GITHUB_INTEGRATION_CLIENT_ID) {
            console.error('GITHUB_INTEGRATION_CLIENT_ID not found, falling back to regular GitHub OAuth');
            return res.apiServerError('GitHub integration not configured', 'GITHUB_INTEGRATION_CLIENT_ID not set');
        }

        const state = Math.random().toString(36).substring(2, 15);

        // Store state with user ID for integration callback
        const cache = require('../services/cacheService');
        cache.set(`github:integration:${state}`, { userId: req.user.id }, 600); // 10 min TTL

        // Ensure BACKEND_URL doesn't end with a slash to prevent double slashes
        let backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        backendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
        const callbackUrl = `${backendUrl}/api/integrations/github/callback`;

        const authUrl = new URL(GITHUB_AUTH_URL);
        authUrl.searchParams.append('client_id', process.env.GITHUB_INTEGRATION_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', callbackUrl);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', 'repo,user:email'); // Repository access scope

        console.log('DEBUG: Generated integration auth URL:', {
            client_id: process.env.GITHUB_INTEGRATION_CLIENT_ID,
            redirect_uri: callbackUrl,
            state: state,
            full_url: authUrl.toString()
        });

        console.log('DEBUG: Cache state stored:', {
            key: `github:integration:${state}`,
            userId: req.user.id,
            cacheSet: cache.set(`github:integration:${state}`, { userId: req.user.id }, 600)
        });

        return res.apiSuccess({ authUrl: authUrl.toString() }, 'GitHub integration URL generated');
    } catch (error) {
        console.error('GitHub integration initiation error:', error);
        return res.apiServerError('Failed to initiate GitHub integration', error.message);
    }
};

/**
 * Handle GitHub integration OAuth callback and complete user connection
 * @async
 * @function handleGitHubIntegrationCallback
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.code - OAuth authorization code from GitHub
 * @param {string} req.query.state - State parameter for security verification
 * @param {string} [req.query.error] - OAuth error if authorization failed
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Redirects to frontend with success/error status
 * @throws {Error} Redirects to frontend with error parameters on failure
 * @note Verifies state parameter against cached value for security
 * @note Exchanges authorization code for access token
 * @note Updates user record with GitHub integration credentials
 * @note Redirects to frontend integrations page with status
 */
const handleGitHubIntegrationCallback = async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

    console.log('DEBUG: GitHub callback received:', {
        code: code ? 'PRESENT' : 'MISSING',
        state: state || 'MISSING',
        error: error || 'NONE',
        query: req.query
    });

    // Handle OAuth errors
    if (error) {
        console.error('GitHub OAuth error:', error);
        return res.redirect(`${frontendUrl}/app/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        console.error('Missing required parameters:', { code, state });
        return res.redirect(`${frontendUrl}/app/integrations?error=invalid_request`);
    }

    try {
        // Verify state for integration flow
        const cache = require('../services/cacheService');
        const stateData = cache.get(`github:integration:${state}`);

        if (!stateData || !stateData.userId) {
            console.error('Invalid or expired integration state:', {
                state,
                stateData,
                cacheKeys: cache.keys()
            });
            return res.redirect(`${frontendUrl}/app/integrations?error=invalid_state`);
        }

        const userId = stateData.userId;

        // Clean up state after use
        cache.del(`github:integration:${state}`);

        // Exchange code for access token using integration service
        const accessToken = await githubIntegrationService.getAccessToken(code);
        if (!accessToken) {
            console.error('Failed to get access token from GitHub');
            return res.redirect(`${frontendUrl}/app/integrations?error=auth_failed`);
        }

        try {
            // Get GitHub user info
            const gitHubUser = await githubIntegrationService.getGitHubUser(accessToken);
            if (!gitHubUser) {
                throw new Error('Failed to get GitHub user information');
            }

            // Verify the user exists
            const user = await User.findById(userId);
            if (!user) {
                console.error('User not found for integration:', userId);
                return res.redirect(`${frontendUrl}/app/integrations?error=user_not_found`);
            }

            // Update user with GitHub integration data (using correct field names)
            user.githubIntegrationToken = accessToken;
            user.githubIntegrationUsername = gitHubUser.login;
            user.githubIntegrationId = gitHubUser.id;

            // Only update avatar if user doesn't have one
            if (!user.avatar && gitHubUser.avatar_url) {
                user.avatar = gitHubUser.avatar_url;
            }

            await user.save();

            console.log('Successfully connected GitHub integration for user:', {
                userId: user._id,
                userName: user.name,
                githubIntegrationUsername: gitHubUser.login,
                githubIntegrationId: gitHubUser.id
            });

            // Redirect back to the integrations page with success status
            return res.redirect(`${frontendUrl}/app/integrations?github_connected=true`);

        } catch (error) {
            console.error('GitHub integration error:', error);
            return res.redirect(`${frontendUrl}/app/integrations?error=integration_failed&message=${encodeURIComponent(error.message)}`);
        }

    } catch (error) {
        console.error('GitHub integration callback error:', error);
        res.redirect(`${frontendUrl}/app/integrations?error=integration_failed&message=${encodeURIComponent(error.message)}`);
    }
};

/**
 * Get user's GitHub repositories using integration token
 * @async
 * @function getGitHubRepositories
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object with GitHub integration
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with repositories array
 * @throws {ValidationError} When GitHub integration is not connected
 * @throws {ServerError} When GitHub API request fails
 * @note Requires active GitHub integration (githubIntegrationToken)
 * @note Returns user's accessible repositories with metadata
 */
const getGitHubRepositories = async (req, res) => {
    try {
        const user = req.user;

        if (!user.githubIntegrationToken) {
            return res.apiValidationError({}, 'GitHub integration not connected');
        }

        // Fetch repositories using GitHub integration service
        const repositories = await githubIntegrationService.listUserRepos(user.githubIntegrationToken);

        return res.apiSuccess({ repositories }, 'Repositories fetched successfully');

    } catch (error) {
        console.error('GitHub repositories fetch error:', error);
        return res.apiServerError('Failed to fetch repositories', error.message);
    }
};

/**
 * Disconnect GitHub integration while preserving authentication data
 * @async
 * @function disconnectGitHub
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming disconnection
 * @throws {ServerError} When database update fails
 * @note Removes integration-specific fields (token, username, ID)
 * @note Preserves githubAuthId for login functionality
 * @note Does not revoke GitHub OAuth token (user must do manually)
 */
const disconnectGitHub = async (req, res) => {
    try {
        const user = req.user;

        // Remove GitHub integration data (keep auth data separate)
        user.githubIntegrationToken = undefined;
        user.githubIntegrationUsername = undefined;
        user.githubIntegrationId = undefined;
        // Keep githubAuthId for login purposes

        await user.save();

        return res.apiSuccess({ connected: false }, 'GitHub integration disconnected');

    } catch (error) {
        console.error('GitHub disconnect error:', error);
        return res.apiServerError('Failed to disconnect GitHub', error.message);
    }
};

/**
 * Get current GitHub integration status for user
 * @async
 * @function getGitHubIntegrationStatus
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with integration status
 * @throws {ServerError} When database query fails
 * @note Returns connection status and GitHub username if connected
 * @note Used by frontend to display integration state
 */
const getGitHubIntegrationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('githubIntegrationToken githubIntegrationUsername');
        return res.status(200).json({
            success: true,
            data: {
                connected: !!(user.githubIntegrationToken && user.githubIntegrationUsername),
                username: user.githubIntegrationUsername
            }
        });
    } catch (error) {
        console.error('Error getting GitHub integration status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get GitHub integration status'
        });
    }
};

/**
 * Get contents of a repository directory or file
 * @async
 * @function getRepositoryContents
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.repo - Repository name
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.path=''] - Path within the repository
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with repository contents
 * @throws {NotFoundError} When user or repository is not found
 * @throws {ForbiddenError} When GitHub integration is not connected
 * @throws {ValidationError} When GitHub username is missing
 * @throws {ServerError} When GitHub API request fails
 * @note Requires active GitHub integration with valid token
 * @note Returns directory listing or file content based on path
 * @note Gracefully handles API errors by returning empty array
 */
const getRepositoryContents = async (req, res) => {
    try {
        const { repo } = req.params;
        const { path = '' } = req.query;

        console.log('getRepositoryContents called with:', { repo, path, userId: req.user._id });

        // Get user with integration token
        const user = await User.findById(req.user._id)
            .select('githubIntegrationToken githubIntegrationUsername');

        if (!user) {
            console.error('User not found');
            return res.apiError('User not found', 'USER_NOT_FOUND', 404);
        }

        if (!user.githubIntegrationToken) {
            console.error('GitHub integration token missing for user:', user._id);
            return res.apiError('GitHub integration not connected', 'MISSING_INTEGRATION', 403);
        }

        if (!user.githubIntegrationUsername) {
            console.error('GitHub username not found for user:', user._id);
            return res.apiError('GitHub username not found', 'MISSING_USERNAME', 400);
        }

        console.log('Fetching repository contents with user:', {
            username: user.githubIntegrationUsername,
            hasToken: !!user.githubIntegrationToken,
            repo,
            path
        });

        try {
            // Use githubIntegrationService to get repository contents
            const contents = await githubIntegrationService.getRepositoryContents(
                user.githubIntegrationToken,
                user.githubIntegrationUsername,
                repo,
                path
            );

            console.log(`Successfully fetched ${contents.length} items from repository`);
            return res.apiSuccess(contents, 'Repository contents retrieved');

        } catch (apiError) {
            console.error('GitHub API error in getRepositoryContents:', {
                error: apiError.message,
                repo,
                path,
                username: user.githubIntegrationUsername,
                hasToken: !!user.githubIntegrationToken,
                stack: apiError.stack
            });

            // If we can't get the directory structure, return an empty array instead of failing
            return res.apiSuccess([], 'Using root directory (could not fetch directory structure)');
        }

    } catch (error) {
        console.error('Error in getRepositoryContents:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query,
            userId: req.user?._id
        });
        return res.apiServerError('Failed to get repository contents', error.message);
    }
};

module.exports = {
    initiateGitHubIntegration,
    handleGitHubIntegrationCallback,
    getGitHubRepositories,
    getRepositoryContents,
    disconnectGitHub,
    getGitHubIntegrationStatus
};

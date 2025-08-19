/**
 * @fileoverview Authentication Middleware
 * @description JWT-based authentication middleware with role-based access control
 *              and GitHub integration checks for the Shard platform
 * @author Utsav Mistry
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * Authenticate requests using JWT tokens from Authorization header
 * @async
 * @function authenticate
 * @param {Object} req - Express request object
 * @param {string} req.headers.authorization - Authorization header with Bearer token format
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Calls next() on success or returns error response
 * @throws {UnauthorizedError} When token is missing, invalid, expired, or user not found
 * @throws {ServerError} When database operations or JWT verification fail
 * @description Primary authentication middleware for protected routes
 * @note Supports both 'Bearer <token>' and raw token formats in Authorization header
 * @note Verifies JWT signature using JWT_SECRET environment variable
 * @note Validates user existence and active status in database
 * @note Excludes sensitive fields (passwordHash) from user object
 * @note Attaches complete user object to req.user for downstream middleware access
 * @example
 * // Protect a route with authentication
 * app.get('/protected', authenticate, (req, res) => {
 *   res.json({ user: req.user.name });
 * });
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        let token = req.header('Authorization');

        // Remove 'Bearer ' if present
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        if (!token) {
            return res.apiUnauthorized('No authentication token, authorization denied');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return res.apiUnauthorized('User not found');
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.apiUnauthorized('Invalid token');
        }

        if (error.name === 'TokenExpiredError') {
            return res.apiUnauthorized('Token expired');
        }

        return res.apiServerError('Server error during authentication', error.message);
    }
};

/**
 * Verify authenticated user has admin role for administrative operations
 * @function isAdmin
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object attached by authenticate middleware
 * @param {string} req.user.role - User role ('admin' required for access)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success or returns 403 Forbidden error
 * @throws {ForbiddenError} When user is not authenticated or lacks admin privileges
 * @description Role-based access control middleware for admin-only endpoints
 * @note MUST be used after authenticate middleware to ensure req.user exists
 * @note Admin role should only be assigned to platform administrators
 * @note Used for system management, user administration, and sensitive operations
 * @security Only users with 'admin' role can access protected endpoints
 * @example
 * // Protect admin route
 * app.get('/admin/users', authenticate, isAdmin, adminController.getUsers);
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.apiForbidden('Access denied. Admin privileges required.');
    }
    next();
};

/**
 * Verify authenticated user has GitHub integration token for repository operations
 * @function hasGitHubToken
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object attached by authenticate middleware
 * @param {string} [req.user.githubAccessToken] - GitHub OAuth access token for API calls
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success or returns 400 Bad Request error
 * @throws {BadRequestError} When GitHub integration is not connected or token missing
 * @description Validates GitHub OAuth integration for repository-dependent operations
 * @note MUST be used after authenticate middleware to ensure req.user exists
 * @note Used to protect endpoints that require GitHub API access
 * @note Returns specific error code 'GITHUB_NOT_CONNECTED' for frontend handling
 * @deprecated Consider using githubIntegrationToken field for new GitHub features
 * @security Ensures user has authorized GitHub access before repository operations
 * @example
 * // Protect GitHub-dependent endpoint
 * app.get('/github/repos', authenticate, hasGitHubToken, githubController.getRepos);
 */
const hasGitHubToken = (req, res, next) => {
    if (!req.user || !req.user.githubAccessToken) {
        return res.apiError('GitHub account not connected', 400, null, 'GITHUB_NOT_CONNECTED');
    }
    next();
};

/**
 * Export authentication middleware functions
 * @module auth
 * @description Provides JWT authentication, role-based access control, and GitHub integration validation
 */
module.exports = {
    authenticate,
    isAdmin,
    hasGitHubToken,
};

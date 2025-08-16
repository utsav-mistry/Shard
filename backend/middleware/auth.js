const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using JWT
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
 * Middleware to check if user has admin role
 * Only you (the platform owner) should have admin role
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.apiForbidden('Access denied. Admin privileges required.');
    }
    next();
};

/**
 * Middleware to check if user has GitHub token
 */
const hasGitHubToken = (req, res, next) => {
    if (!req.user || !req.user.githubAccessToken) {
        return res.apiError('GitHub account not connected', 400, null, 'GITHUB_NOT_CONNECTED');
    }
    next();
};

module.exports = {
    authenticate,
    isAdmin,
    hasGitHubToken,
};

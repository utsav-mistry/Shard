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
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
    next();
};

/**
 * Middleware to check if user has owner or admin role
 */
const isOwnerOrAdmin = (req, res, next) => {
    const isOwner = req.user && req.user.id === req.params.userId;
    const isAdminUser = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdminUser) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Owner or admin privileges required.' 
        });
    }
    next();
};

/**
 * Middleware to check if user has GitHub token
 */
const hasGitHubToken = (req, res, next) => {
    if (!req.user || !req.user.githubAccessToken) {
        return res.status(400).json({ 
            success: false, 
            message: 'GitHub account not connected' 
        });
    }
    next();
};

module.exports = {
    authenticate,
    isAdmin,
    isOwnerOrAdmin,
    hasGitHubToken,
};

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const { generateToken } = require('../config/jwt');
const githubService = require("../services/githubService");
const googleService = require("../services/googleService");

// Manual User Registration
const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !password) {
        return res.apiValidationError(
            {
                email: !email ? 'Email is required' : null,
                password: !password ? 'Password is required' : null
            },
            'Email and password are required'
        );
    }

    try {
        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.apiValidationError(
                { email: 'User already exists with this email' },
                'User already exists with this email'
            );
        }

        // Create new user - password will be hashed by pre-save hook
        user = new User({
            email: email.toLowerCase().trim(),
            passwordHash: password, // Will be hashed by pre-save hook
            name: (name || email.split('@')[0]).trim()
        });

        await user.save();

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail registration if email fails
        }

        // Generate JWT token
        const token = generateToken(user);

        // Prepare user data to return (exclude sensitive info)
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        return res.apiCreated({ token, user: userResponse }, 'Registration successful');
    } catch (err) {
        console.error('Register error:', err);
        return res.apiServerError('Server error during registration', err.message);
    }
};

// Manual User Login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.apiValidationError(
            {
                email: !email ? 'Email is required' : null,
                password: !password ? 'Password is required' : null
            },
            'Email and password are required'
        );
    }

    try {
        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Check if user exists and has a password set
        if (!user || !user.passwordHash) {
            return res.apiUnauthorized('Invalid email or password');
        }

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.apiUnauthorized('Invalid email or password');
        }

        // Generate JWT token
        const token = generateToken(user);

        // Prepare user data to return (exclude sensitive info)
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubId: user.githubId,
            googleId: user.googleId
        };

        return res.apiSuccess({ token, user: userResponse }, 'Login successful');
    } catch (err) {
        console.error('Login error:', err);
        return res.apiServerError('Server error during login', err.message);
    }
};

// GitHub OAuth Callback
const githubOAuthCallback = async (req, res) => {
    const code = req.query.code || req.body.code;
    const error = req.query.error;

    if (error) {
        console.error('GitHub OAuth error:', error);
        return res.redirect(`/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        const accessToken = await githubService.getAccessToken(code);
        const gitHubUser = await githubService.getGitHubUser(accessToken);

        let user = await User.findOne({ 
            $or: [
                { githubId: gitHubUser.id },
                { email: gitHubUser.email || `${gitHubUser.login}@github.com` }
            ]
        });

        if (!user) {
            // Generate a more readable name from GitHub login if name is not provided
            const generateReadableName = (login) => {
                // Convert login from 'some-user-name' to 'Some User Name'
                return login
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            };

            user = new User({
                githubId: gitHubUser.id,
                email: gitHubUser.email || `${gitHubUser.login}@github.com`,
                name: gitHubUser.name || generateReadableName(gitHubUser.login),
                avatar: gitHubUser.avatar_url,
                isEmailVerified: !!gitHubUser.email_verified
            });
            await user.save();
        } else if (!user.githubId) {
            // Link GitHub to existing account
            user.githubId = gitHubUser.id;
            if (!user.avatar) user.avatar = gitHubUser.avatar_url;
            await user.save();
        }

        const token = generateToken(user);
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        
        // Set HTTP-only cookie for better security
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000 // Default to 7 days if not set
        });

        // Redirect to frontend with token in URL (for clients that can't access cookies)
        const redirectUrl = new URL('/auth/callback', frontendUrl);
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('provider', 'github');
        
        return res.redirect(redirectUrl.toString());
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        const errorUrl = new URL('/login', frontendUrl);
        errorUrl.searchParams.set('error', 'github_oauth_failed');
        return res.redirect(errorUrl.toString());
    }
};

// GitHub OAuth Callback (for login)
const githubOAuthCallbackLogin = async (req, res) => {
    const code = req.body.code;

    if (!code) {
        return res.apiValidationError({ code: 'Authorization code is required' }, 'Missing authorization code');
    }

    try {
        const accessToken = await githubService.getAccessToken(code);
        const gitHubUser = await githubService.getGitHubUser(accessToken);

        // Find user by GitHub ID or email
        let user = await User.findOne({ 
            $or: [
                { githubId: gitHubUser.id },
                { email: gitHubUser.email || `${gitHubUser.login}@github.com` }
            ]
        });

        if (!user) {
            // Generate a more readable name from GitHub login if name is not provided
            const generateReadableName = (login) => {
                return login
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            };

            user = new User({
                githubId: gitHubUser.id,
                email: gitHubUser.email || `${gitHubUser.login}@github.com`,
                name: gitHubUser.name || generateReadableName(gitHubUser.login),
                avatar: gitHubUser.avatar_url,
                githubUsername: gitHubUser.login,
                isVerified: !!gitHubUser.email
            });
            await user.save();
        } else if (!user.githubId) {
            // Link GitHub to existing account
            user.githubId = gitHubUser.id;
            user.githubUsername = gitHubUser.login;
            if (!user.avatar) user.avatar = gitHubUser.avatar_url;
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        
        // Return user data and token
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubUsername: user.githubUsername,
            isVerified: user.isVerified
        };

        return res.apiSuccess({ token, user: userResponse }, 'GitHub login successful');
    } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        return res.apiServerError('GitHub authentication failed', err.message);
    }
};

// Google OAuth Callback (for login)
const googleOAuthCallback = async (req, res) => {
    const code = req.body.code;

    if (!code) {
        return res.apiValidationError({ code: 'Authorization code is required' }, 'Missing authorization code');
    }

    try {
        const accessToken = await googleService.getAccessToken(code);
        const googleUser = await googleService.getGoogleUser(accessToken);

        // Find user by Google ID or email
        let user = await User.findOne({
            $or: [
                { googleId: googleUser.id },
                { email: googleUser.email }
            ]
        });

        if (!user) {
            // Create new user
            user = new User({
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                isVerified: googleUser.verified_email || false
            });
            await user.save();
        } else if (!user.googleId) {
            // Link Google to existing account
            user.googleId = googleUser.id;
            if (!user.avatar) user.avatar = googleUser.picture;
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        
        // Return user data and token
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified
        };

        return res.apiSuccess({ token, user: userResponse }, 'Google login successful');
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return res.apiServerError('Google authentication failed', err.message);
    }
};

// Google OAuth Callback (GET) - for redirect_uri pointing to backend
const googleOAuthCallbackRedirect = async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        const errorUrl = new URL('/login', frontendUrl);
        errorUrl.searchParams.set('error', 'google_oauth_denied');
        return res.redirect(errorUrl.toString());
    }

    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        const accessToken = await googleService.getAccessToken(code);
        const googleUser = await googleService.getGoogleUser(accessToken);

        let user = await User.findOne({
            $or: [
                { googleId: googleUser.id },
                { email: googleUser.email }
            ]
        });

        if (!user) {
            user = new User({
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                isVerified: googleUser.verified_email || false
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleUser.id;
            if (!user.avatar) user.avatar = googleUser.picture;
            await user.save();
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000,
        });

        const frontendBase = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        const redirectUrl = new URL('/auth/callback', frontendBase);
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('provider', 'google');
        return res.redirect(redirectUrl.toString());
    } catch (err) {
        console.error('Google OAuth GET callback error:', err);
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        const errorUrl = new URL('/login', frontendUrl);
        errorUrl.searchParams.set('error', 'google_oauth_failed');
        return res.redirect(errorUrl.toString());
    }
};

// Get User Profile
const getUserProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        if (!user) {
            return res.apiNotFound('User');
        }

        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubId: user.githubId,
            googleId: user.googleId,
            createdAt: user.createdAt
        };

        return res.apiSuccess(userResponse, 'Profile retrieved successfully');
    } catch (err) {
        console.error('Get profile error:', err);
        return res.apiServerError('Failed to retrieve profile', err.message);
    }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        if (!user) {
            return res.apiNotFound('User');
        }

        const { name, avatar } = req.body;

        // Update only the fields that were provided
        if (name !== undefined) user.name = name.trim();
        if (avatar !== undefined) user.avatar = avatar.trim();

        await user.save();

        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubId: user.githubId,
            googleId: user.googleId
        };

        return res.apiSuccess(userResponse, 'Profile updated successfully');
    } catch (err) {
        console.error('Update profile error:', err);
        return res.apiServerError('Failed to update profile', err.message);
    }
};

module.exports = {
    registerUser,
    loginUser,
    githubOAuthCallback,
    githubOAuthCallbackLogin,
    googleOAuthCallback,
    googleOAuthCallbackRedirect,
    getUserProfile,
    updateUserProfile
};
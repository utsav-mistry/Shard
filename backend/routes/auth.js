const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const querystring = require('querystring');

const router = express.Router();

// Use authenticate as protect for consistency
const protect = authenticate;

// OAuth Configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

// Generate OAuth URL helper
const generateOAuthUrl = (baseUrl, options) => {
  return `${baseUrl}?${querystring.stringify(options)}`;
};

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// OAuth Routes for LOGIN (Authentication)
// Initiate Google OAuth Login
router.get('/google/login', (req, res) => {
  const url = generateOAuthUrl(GOOGLE_AUTH_URL, {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'profile email',
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(url);
});

// Initiate GitHub OAuth Login
router.get('/github/login', (req, res) => {
  const url = generateOAuthUrl(GITHUB_AUTH_URL, {
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'user:email',
  });
  res.redirect(url);
});

// OAuth Callback handlers for processing codes from frontend
router.post('/google/callback', authController.googleOAuthCallback);
router.post('/github/callback', authController.githubOAuthCallbackLogin);

// GitHub OAuth GET callback (matches GitHub app redirect URI)
router.get('/github/callback', authController.githubOAuthCallback);

// Google OAuth GET callback (matches Google app redirect URI)
router.get('/google/callback', authController.googleOAuthCallbackRedirect);

// Protected routes - require authentication
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            return res.apiNotFound('User');
        }
        return res.apiSuccess({ user }, 'Profile fetched successfully');
    } catch (err) {
        console.error('Profile fetch error:', err);
        return res.apiServerError('Failed to fetch profile', err.message);
    }
});

// Disconnect GitHub
router.post('/disconnect-github', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.apiNotFound('User');
        }
        
        // Clear GitHub integration data
        user.githubAccessToken = undefined;
        user.githubUsername = undefined;
        user.githubId = undefined;
        await user.save();
        
        return res.apiSuccess({}, 'GitHub disconnected successfully');
    } catch (err) {
        console.error('GitHub disconnect error:', err);
        return res.apiServerError('Failed to disconnect GitHub', err.message);
    }
});

router.put("/profile", protect, authController.updateUserProfile);

module.exports = router;

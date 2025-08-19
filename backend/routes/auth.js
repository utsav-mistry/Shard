/**
 * @fileoverview Authentication Routes
 * @description Express routes for user authentication, OAuth integration, and profile management
 * @module routes/auth
 * @requires express
 * @requires ../controllers/authController
 * @requires ../middleware/auth
 * @requires ../models/User
 * @requires querystring
 * @author Utsav Mistry
 * @version 1.0.0
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: User full name
 *         avatar:
 *           type: string
 *           description: User avatar URL
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         githubAuthId:
 *           type: string
 *           description: GitHub authentication ID
 *         googleId:
 *           type: string
 *           description: Google authentication ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User password
 *         name:
 *           type: string
 *           description: User full name
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           description: User password
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT authentication token
 *             user:
 *               $ref: '#/components/schemas/User'
 *         message:
 *           type: string
 *     
 *     ProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Updated user name
 *         avatar:
 *           type: string
 *           description: Updated avatar URL
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * tags:
 *   - name: Authentication
 *     description: User authentication and profile management
 */

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User already exists
 */
router.post("/register", authController.registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post("/login", authController.loginUser);

/**
 * @swagger
 * /api/auth/google/login:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/auth/github/login:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     description: Redirects user to GitHub OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 *       500:
 *         description: Server error
 */
router.get('/github/login', (req, res) => {
  const url = generateOAuthUrl(GITHUB_AUTH_URL, {
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'user:email',
  });
  res.redirect(url);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   post:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: OAuth login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/google/callback', authController.googleOAuthCallback);

/**
 * @swagger
 * /api/auth/github/callback:
 *   post:
 *     summary: Handle GitHub OAuth callback (POST)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: OAuth login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/github/callback', authController.githubOAuthCallbackLogin);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: Handle GitHub OAuth callback (GET)
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code
 *     responses:
 *       302:
 *         description: Redirect to frontend with auth result
 *       400:
 *         description: OAuth error
 */
router.get('/github/callback', authController.githubOAuthCallback);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback (GET)
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code
 *     responses:
 *       302:
 *         description: Redirect to frontend with auth result
 *       400:
 *         description: OAuth error
 */
router.get('/google/callback', authController.googleOAuthCallbackRedirect);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Profile fetched successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            return res.apiNotFound('User');
        }
        
        // Return user data in the format expected by frontend AuthContext
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubAuthId: user.githubAuthId,
            googleId: user.googleId,
            createdAt: user.createdAt
        };
        
        return res.apiSuccess({ user: userResponse }, 'Profile fetched successfully');
    } catch (err) {
        console.error('Profile fetch error:', err);
        return res.apiServerError('Failed to fetch profile', err.message);
    }
});

/**
 * @swagger
 * /api/auth/disconnect-github:
 *   post:
 *     summary: Disconnect GitHub integration
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: GitHub disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/disconnect-github', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.apiNotFound('User');
        }
        
        // Clear GitHub integration data (keep auth separate)
        user.githubIntegrationToken = undefined;
        user.githubIntegrationUsername = undefined;
        user.githubIntegrationId = undefined;
        await user.save();
        
        return res.apiSuccess({}, 'GitHub disconnected successfully');
    } catch (err) {
        console.error('GitHub disconnect error:', err);
        return res.apiServerError('Failed to disconnect GitHub', err.message);
    }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/profile", protect, authController.updateUserProfile);

/**
 * @namespace authRoutes
 * @description Express router for authentication endpoints including OAuth flows
 */
module.exports = router;

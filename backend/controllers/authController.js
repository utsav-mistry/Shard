const User = require("../models/User");
const { generateToken } = require("../config/jwt");
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
    const { code } = req.body;

    if (!code) {
        return res.apiValidationError({ code: 'Authorization code is required' }, 'Authorization code is required');
    }

    try {
        const accessToken = await githubService.getAccessToken(code);
        const gitHubUser = await githubService.getGitHubUser(accessToken);

        let user = await User.findOne({ githubId: gitHubUser.id });
        if (!user) {
            user = new User({
                githubId: gitHubUser.id,
                email: gitHubUser.email || `${gitHubUser.login}@github.com`,
                name: gitHubUser.name || gitHubUser.login,
                avatar: gitHubUser.avatar_url,
            });
            await user.save();
        }

        const token = generateToken(user);
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            githubId: user.githubId
        };

        return res.apiSuccess({ token, user: userResponse }, 'GitHub authentication successful');
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        return res.apiServerError('GitHub OAuth failed', err.message);
    }
};

// Google OAuth Callback
const googleOAuthCallback = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.apiValidationError({ code: 'Authorization code is required' }, 'Authorization code is required');
    }

    try {
        const accessToken = await googleService.getAccessToken(code);
        const googleUser = await googleService.getGoogleUser(accessToken);

        let user = await User.findOne({ googleId: googleUser.id });
        if (!user) {
            user = new User({
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
            });
            await user.save();
        }

        const token = generateToken(user);
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            googleId: user.googleId
        };

        return res.apiSuccess({ token, user: userResponse }, 'Google authentication successful');
    } catch (err) {
        console.error('Google OAuth error:', err);
        return res.apiServerError('Google OAuth failed', err.message);
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
    googleOAuthCallback,
    getUserProfile,
    updateUserProfile
};
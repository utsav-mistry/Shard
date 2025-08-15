const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const githubService = require("../services/githubService");
const googleService = require("../services/googleService");

// -------------------- Manual Signup --------------------
const registerUser = async (req, res) => {
    const { email, password, name } = req.body;
    
    // Input validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Email and password are required" 
        });
    }

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                success: false,
                message: "User already exists with this email" 
            });
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

        res.status(201).json({ 
            success: true,
            message: "Registration successful",
            token,
            user: userResponse
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ 
            success: false,
            message: "Server error during registration" 
        });
    }
};

// -------------------- Manual Login --------------------
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Email and password are required" 
        });
    }

    try {
        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        // Check if user exists and has a password set
        if (!user || !user.passwordHash) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
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

        res.json({ 
            success: true,
            message: "Login successful",
            token,
            user: userResponse
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: "Server error during login" 
        });
    }
};

// -------------------- GitHub OAuth Callback --------------------
const githubOAuthCallback = async (req, res) => {
    const { code } = req.body;

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
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, githubId: user.githubId } });
    } catch (err) {
        res.status(500).json({ message: "GitHub OAuth failed" });
    }
};

// -------------------- Google OAuth Callback --------------------
const googleOAuthCallback = async (req, res) => {
    const { code } = req.body;

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
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, googleId: user.googleId } });
    } catch (err) {
        res.status(500).json({ message: "Google OAuth failed" });
    }
};

// -------------------- Get User Profile --------------------
const getUserProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            githubId: user.githubId,
            googleId: user.googleId
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// -------------------- Update User Profile --------------------
const updateUserProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, avatar } = req.body;
        
        // Update only the fields that were provided
        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        
        await user.save();

        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            githubId: user.githubId,
            googleId: user.googleId
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: "Server error" });
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

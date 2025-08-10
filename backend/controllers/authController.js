const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const githubService = require("../services/githubService");
const googleService = require("../services/googleService");

// -------------------- Manual Signup --------------------
const registerUser = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        user = new User({ 
            email, 
            passwordHash: password,
            name: name || email.split('@')[0] // Use part of email as name if not provided
        });
        await user.save();

        const token = generateToken(user);
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email,
                name: user.name,
                avatar: user.avatar
            } 
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// -------------------- Manual Login --------------------
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.passwordHash)
            return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        const token = generateToken(user);
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                githubId: user.githubId,
                googleId: user.googleId
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: "Server error" });
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

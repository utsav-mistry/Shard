const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    // Ensure JWT_EXPIRES_IN is a string with a time unit (e.g., '7d', '24h', '60m')
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    // If it's a number without a unit, default to days
    const expiresInValue = /^\d+$/.test(expiresIn) ? `${expiresIn}d` : expiresIn;
    
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            githubId: user.githubId,
            googleId: user.googleId
        },
        process.env.JWT_SECRET,
        { expiresIn: expiresInValue }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

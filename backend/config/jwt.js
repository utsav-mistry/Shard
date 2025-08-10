const jwt = require("jsonwebtoken");

const generateToken = (user) => {
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
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

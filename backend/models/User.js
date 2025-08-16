const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        passwordHash: {
            type: String,
        },
        name: {
            type: String,
        },
        avatar: {
            type: String,
        },
        googleId: {
            type: String,
        },
        githubId: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: "users",
        timestamps: true // Add automatic createdAt and updatedAt
    }
);

// Indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true }); // Email uniqueness and login lookup
UserSchema.index({ role: 1 }); // For admin queries
UserSchema.index({ githubId: 1 }, { sparse: true }); // For GitHub OAuth
UserSchema.index({ googleId: 1 }, { sparse: true }); // For Google OAuth
UserSchema.index({ createdAt: -1 }); // For user registration analytics

// Hash password before saving (only for manual signup)
UserSchema.pre("save", async function (next) {
    if (!this.isModified("passwordHash")) return next();
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Compare entered password for manual login
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);

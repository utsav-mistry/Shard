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
            type: String, // Optional for OAuth users
        },
        name: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        // OAuth Authentication fields (for login)
        githubAuthId: {
            type: String,
            sparse: true,
            unique: true,
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
        avatar: {
            type: String,
        },

        // GitHub Integration fields (for repository access)
        githubIntegrationToken: {
            type: String,
        },
        githubIntegrationUsername: {
            type: String,
        },
        githubIntegrationId: {
            type: String,
        },

        // Profile fields
        username: {
            type: String,
        },
        displayName: {
            type: String,
        },
        bio: {
            type: String,
        },
        location: {
            type: String,
        },
        website: {
            type: String,
        },

        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },

        // Billing
        tokens: {
            type: Number,
            default: 100 // Free starting tokens
        },
    },
    {
        collection: "users",
        timestamps: true // Add automatic createdAt and updatedAt
    }
);

// Indexes for better query performance
UserSchema.index({ role: 1 }); // For admin queries
UserSchema.index({ githubAuthId: 1 }, { sparse: true }); // For GitHub Authentication
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

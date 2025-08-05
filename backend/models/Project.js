const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        repoUrl: {
            type: String,
            required: true,
        },
        stack: {
            type: String,
            enum: ["mern", "django", "flask"],
            required: true,
        },
        subdomain: {
            type: String,
            required: true,
            unique: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: "projects" }
);

module.exports = mongoose.model("Project", ProjectSchema);

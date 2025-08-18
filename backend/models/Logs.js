const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        deploymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deployment",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "setup",       // cloning, initialization
                "config",      // env vars and secrets
                "build",       // building/compiling
                "deploy",      // container build/start
                "runtime",     // live logs
                "error",       // any failure
                "complete",    // success
                "ai-review",   // AI code review
                "queue"        // job queuing
            ],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: "logs" }
);

module.exports = mongoose.model("Logs", LogSchema);

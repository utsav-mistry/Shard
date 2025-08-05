const mongoose = require("mongoose");

const DeploymentSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "running", "success", "failed"],
            default: "pending",
        },
        logs: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        finishedAt: {
            type: Date,
        },
    },
    { collection: "deployments" }
);

module.exports = mongoose.model("Deployment", DeploymentSchema);

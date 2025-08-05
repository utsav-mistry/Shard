const mongoose = require("mongoose");

const EnvVarSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
        value: {
            type: String,
            required: true, // Encrypted value will be stored here
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: "envvars" }
);

module.exports = mongoose.model("EnvVar", EnvVarSchema);

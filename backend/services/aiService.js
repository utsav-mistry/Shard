const axios = require("axios");

// The AI microservice URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/review";

const runCodeReview = async (repoUrl, branch) => {
    try {
        const response = await axios.post(AI_SERVICE_URL, {
            repoUrl,
            branch
        });

        return response.data; // The review results
    } catch (err) {
        console.error("AI Code Review failed:", err);
        return { error: "AI Review failed" };
    }
};

module.exports = { runCodeReview };

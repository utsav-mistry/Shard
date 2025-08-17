const axios = require('axios');

async function analyzeRepo(repoPath, projectId) {
    try {
        const response = await axios.post('http://localhost:8000/review/', {
            repoPath,
            projectId,
        });

        const { verdict, issues } = response.data;

        return {
            verdict,
            issues,
            issueCount: issues.length,
        };
    } catch (err) {
        console.error("[AI Review Error]", err.message);
        return {
            verdict: "deny",
            issues: [],
            issueCount: 0,
            error: "Failed to connect to AI review service"
        };
    }
}

module.exports = { analyzeRepo };

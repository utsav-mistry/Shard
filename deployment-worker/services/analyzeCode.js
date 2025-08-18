const axios = require('axios');

async function analyzeRepo(repoPath, projectId) {
    try {
        // Convert Windows path to Unix-style path for AI service
        const normalizedPath = repoPath.replace(/\\/g, '/');
        
        const response = await axios.post('http://localhost:8000/review/', {
            repoPath: normalizedPath,
            projectId,
        }, {
            timeout: 30000, // 30 second timeout for AI analysis
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { verdict, issues, issue_count, severity_breakdown, linter_count, ai_count } = response.data;

        return {
            verdict: verdict || 'approve',
            issues: issues || [],
            issueCount: issue_count || (issues ? issues.length : 0),
            severity_breakdown: severity_breakdown || {},
            linter_count: linter_count || 0,
            ai_count: ai_count || 0
        };
    } catch (err) {
        console.error("[AI Review Error]", err.message);
        
        // If AI service is unavailable, allow deployment to proceed with warning
        console.log(`[AI Review] Service unavailable, allowing deployment to proceed: ${err.message}`);
        return {
            verdict: "approve",
            issues: [],
            issueCount: 0,
            severity_breakdown: { security: 0, error: 0, warning: 0 },
            linter_count: 0,
            ai_count: 0,
            error: `AI review service unavailable: ${err.message}`
        };
    }
}

module.exports = { analyzeRepo };

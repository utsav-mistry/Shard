/**
 * @fileoverview Code Analysis Service
 * @description Service for analyzing repository code using AI review service
 * @author Utsav Mistry
 * @version 0.2.3
 */

const axios = require('axios');

/**
 * Analyze repository code using AI review service
 * @async
 * @function analyzeRepo
 * @param {string} repoPath - Absolute path to the repository directory
 * @param {string} projectId - Unique project identifier for tracking
 * @returns {Promise<Object>} Analysis results from AI service
 * @returns {string} returns.verdict - Review verdict ('approve', 'deny', 'manual_review')
 * @returns {Array<Object>} returns.issues - Array of detected code issues
 * @returns {number} returns.issueCount - Total number of issues found
 * @returns {Object} returns.severity_breakdown - Count of issues by severity level
 * @returns {number} returns.linter_count - Number of linter-detected issues
 * @returns {number} returns.ai_count - Number of AI-detected issues
 * @returns {string} [returns.error] - Error message if service unavailable
 * @throws {Error} Network or service communication errors
 * @description Sends repository for AI analysis and returns structured results.
 * Falls back to approval if AI service is unavailable.
 * @example
 * const result = await analyzeRepo('/path/to/repo', 'proj123');
 * if (result.verdict === 'approve') {
 *   // Proceed with deployment
 * }
 */
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

/**
 * Export code analysis functions
 * @module analyzeCode
 * @description Service for AI-powered code analysis and review
 */
module.exports = { analyzeRepo };

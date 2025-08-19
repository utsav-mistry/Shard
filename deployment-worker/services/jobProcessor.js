/**
 * @fileoverview Deployment Job Processor
 * @description Main service for processing deployment jobs with AI review, environment injection, and containerization
 * @author Utsav Mistry
 * @version 0.2.3
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { fileURLToPath } = require('url');
const { updateDeploymentStatus } = require('./statusUpdater.js');
const logger = require('../utils/logger.js');
const { logStep } = require('../utils/logger.js');
const { sendDeploymentNotification } = require('./emailNotifier.js');
const { injectEnv, fetchEnvVars } = require('./envInjector.js');
const { deployContainer, cleanupExistingContainer } = require('../utils/dockerHelpers.js');
const { analyzeRepo } = require('./analyzeCode.js');
const { cloneRepo } = require('./repoCloner.js');
const { checkDockerStatus } = require('../utils/dockerChecker.js');

/**
 * Update deployment record with AI review results
 * @async
 * @function updateDeploymentWithAIResults
 * @param {string} deploymentId - Unique deployment identifier
 * @param {Object} aiResults - AI analysis results from analyzeRepo
 * @param {string} token - JWT authentication token
 * @returns {Promise<void>} Resolves when update is complete or fails silently
 * @description Stores AI review results in backend for frontend display. Non-critical operation.
 */
const updateDeploymentWithAIResults = async (deploymentId, aiResults, token) => {
    try {
        const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deploy/ai-results`, {
            deploymentId,
            aiReviewResults: aiResults
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200) {
            logger.info(`AI results updated for deployment ${deploymentId}`);
        }
    } catch (error) {
        logger.error(`Failed to update AI results for deployment ${deploymentId}:`, error.message);
        // Don't throw - this is not critical for deployment success
    }
};

/**
 * Update deployment record with Git commit information
 * @async
 * @function updateDeploymentWithCommitInfo
 * @param {string} deploymentId - Unique deployment identifier
 * @param {Object} commitInfo - Git commit details
 * @param {string} commitInfo.commitHash - Git commit hash
 * @param {string} commitInfo.commitMessage - Commit message
 * @param {string} commitInfo.author - Commit author
 * @param {string} commitInfo.commitDate - Commit timestamp
 * @param {string} token - JWT authentication token
 * @returns {Promise<void>} Resolves when update is complete or fails silently
 * @description Updates deployment record with Git metadata for tracking. Non-critical operation.
 */
const updateDeploymentWithCommitInfo = async (deploymentId, commitInfo, token) => {
    try {
        const response = await axios.patch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deploy/${deploymentId}`, {
            commitHash: commitInfo.commitHash,
            commitMessage: commitInfo.commitMessage,
            author: commitInfo.author,
            commitDate: commitInfo.commitDate
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200) {
            logger.info(`Commit info updated for deployment ${deploymentId}`);
        }
    } catch (error) {
        logger.error(`Failed to update commit info for deployment ${deploymentId}:`, error.message);
        // Don't throw - this is not critical for deployment success
    }
};

const CONFIG = {
    DEPLOYMENT_PORT: 4200,
    LOG_DIR: path.join(__dirname, "../logs"),
    API_TIMEOUT: 10000,
    DOCKER_TIMEOUT: 300000,
};

if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
}

/**
 * Process a deployment job through the complete pipeline
 * @async
 * @function processJob
 * @param {Object} job - Deployment job object
 * @param {string} job.projectId - Unique project identifier
 * @param {string} job.repoUrl - Git repository URL to deploy
 * @param {string} job.stack - Technology stack ('mern', 'django', 'flask')
 * @param {string} job.subdomain - Subdomain for deployment
 * @param {string} job.userEmail - User email for notifications
 * @param {string} job.deploymentId - Unique deployment identifier
 * @param {string} job.token - JWT authentication token
 * @returns {Promise<void>} Resolves when deployment is complete
 * @throws {Error} Deployment pipeline errors
 * @description Complete deployment pipeline: clone → AI review → env injection → containerization.
 * Handles status updates, notifications, and error recovery throughout the process.
 * @example
 * await processJob({
 *   projectId: 'proj123',
 *   repoUrl: 'https://github.com/user/repo.git',
 *   stack: 'mern',
 *   subdomain: 'myapp',
 *   userEmail: 'user@example.com',
 *   deploymentId: 'deploy456',
 *   token: 'jwt_token'
 * });
 */
const processJob = async (job) => {
    const {
        projectId,
        repoUrl,
        stack,
        subdomain,
        userEmail,
        deploymentId,
        token
    } = job;

    if (!token) throw new Error("Authentication token is required");

    const containerName = subdomain;
    const logPath = path.join(CONFIG.LOG_DIR, `${deploymentId}.log`);

    try {
        // Check Docker status before starting deployment
        const dockerAvailable = await checkDockerStatus();
        if (!dockerAvailable) {
            throw new Error("Docker daemon is not running. Please start Docker Desktop or Docker daemon and try again.");
        }
        // Send deployment started notification
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "started");

        // === Step 1: Clone Repository ===
        // The deployment status is 'pending' by default.
        await logStep(projectId, deploymentId, "setup", "Cloning repository", token);
        const repoInfo = await cloneRepo(repoUrl, projectId);
        const localPath = repoInfo.path;
        const uniqueRepoId = repoInfo.uniqueId;

        logger.info(`Repository cloned to: ${localPath} with unique ID: ${uniqueRepoId}`);

        // Update deployment with commit information
        await updateDeploymentWithCommitInfo(deploymentId, {
            commitHash: repoInfo.commitHash,
            commitMessage: repoInfo.commitMessage,
            author: repoInfo.author,
            commitDate: repoInfo.date
        }, token);

        await logStep(projectId, deploymentId, "setup", `Repository cloned - ${repoInfo.commitMessage.substring(0, 50)}...`, token);

        // === Step 2: AI Review ===
        await updateDeploymentStatus(deploymentId, "reviewing", token);
        await logStep(projectId, deploymentId, "setup", "Starting AI code review", token);
        const aiReviewResult = await analyzeRepo(localPath, deploymentId);
        const { verdict, issues, issueCount, severity_breakdown, linter_count, ai_count } = aiReviewResult;

        // Store AI review results for frontend display
        await updateDeploymentWithAIResults(deploymentId, aiReviewResult, token);

        // Debug log the AI review result
        console.log(`[AI Review Debug] Verdict: ${verdict}, Issues: ${issueCount}, Breakdown:`, severity_breakdown);

        // Fix AI logic - if verdict is "deny" but there are 0 security and 0 errors, treat as approve
        if (verdict === "deny") {
            const securityIssues = severity_breakdown?.security || 0;
            const errorIssues = severity_breakdown?.error || 0;

            if (securityIssues === 0 && errorIssues === 0) {
                console.log(`[AI Review] Overriding deny verdict - no critical issues found`);
                // Continue with deployment
            } else {
                await logStep(projectId, deploymentId, "error", `AI denied deployment: ${securityIssues} security, ${errorIssues} errors`, token);
                fs.appendFileSync(logPath, `AI_REVIEW_DENIED: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
                await sendDeploymentNotification(userEmail, projectId, deploymentId, "ai_denied");
                await updateDeploymentStatus(deploymentId, "failed", token);
                return;
            }
        }

        if (verdict === "manual_review") {
            await logStep(projectId, deploymentId, "warning", `AI flagged for manual review: ${issueCount} issues found (${linter_count} linter, ${ai_count} AI)`, token);
            fs.appendFileSync(logPath, `AI_REVIEW_MANUAL: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, deploymentId, "ai_manual_review");
            await updateDeploymentStatus(deploymentId, "failed", token, { reason: "Manual review required" });
            return;
        }

        await logStep(projectId, deploymentId, "setup", `AI review passed: ${issueCount} minor issues found`, token);

        // === Step 3: Fetch and Inject Environment Variables ===
        await updateDeploymentStatus(deploymentId, "configuring", token);
        await logStep(projectId, deploymentId, "config", "Fetching environment variables", token);
        const envVars = await fetchEnvVars(projectId, token, logPath);
        const envResult = await injectEnv(localPath, envVars, projectId);

        if (envResult.skipped) {
            await logStep(projectId, deploymentId, "config", "No environment variables - proceeding without .env file", token);
        } else {
            await logStep(projectId, deploymentId, "config", `Environment configured: ${envResult.variablesCount} variables`, token);
        }

        // === Step 4: Build and Run Container ===
        await updateDeploymentStatus(deploymentId, "building", token);
        await logStep(projectId, deploymentId, "deploy", "Starting container deployment", token);
        await cleanupExistingContainer(containerName);
        const dockerLog = await deployContainer(localPath, stack, subdomain, projectId, deploymentId);

        // Log the custom domain URL
        const PORT_CONFIG = {
            mern: { backend: 12000 },
            django: { backend: 13000 },
            flask: { backend: 14000 },
        };

        const ports = PORT_CONFIG[stack?.toLowerCase()];
        if (ports) {
            const customUrl = stack?.toLowerCase() === 'mern' && ports.frontend
                ? `http://${subdomain}.localhost:${ports.frontend}`
                : `http://${subdomain}.localhost:${ports.backend}`;

            await logStep(projectId, deploymentId, "deploy", `Application deployed at: ${customUrl}`, token);
            logger.info(`Deployment ${deploymentId} accessible at: ${customUrl}`);
        }

        fs.writeFileSync(logPath, dockerLog?.toString() || "No Docker log output available.", {
            encoding: "utf-8"
        });

        // === Step 5: Finalize ===
        await logStep(projectId, deploymentId, "complete", "Deployment successful", token);
        await updateDeploymentStatus(deploymentId, "success", token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "success");

    } catch (error) {
        // === Step 6: Handle Any Errors ===
        await handleDeploymentError(error, projectId, deploymentId, userEmail, logPath, token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "failed", error.message);
        throw error;
    }
};

/**
 * Handle deployment errors with logging and status updates
 * @async
 * @function handleDeploymentError
 * @param {Error} error - The error that occurred during deployment
 * @param {string} projectId - Unique project identifier
 * @param {string} deploymentId - Unique deployment identifier
 * @param {string} userEmail - User email for notifications
 * @param {string} logPath - Path to deployment log file
 * @param {string} token - JWT authentication token
 * @returns {Promise<void>} Resolves when error handling is complete
 * @description Logs error details to file and backend, updates deployment status to failed.
 * Ensures proper cleanup and user notification on deployment failures.
 */
const handleDeploymentError = async (error, projectId, deploymentId, userEmail, logPath, token) => {
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    fs.appendFileSync(logPath, `DEPLOYMENT_ERROR: ${JSON.stringify(errorDetails)}\n`);

    try {
        await axios.post("http://localhost:5000/api/logs", {
            projectId,
            deploymentId,
            type: "error",
            content: `Deployment failed: ${error.message}`,
            timestamp: new Date().toISOString()
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error("Error handling failed:", err.message);
    }
};

/**
 * Export job processing functions
 * @module jobProcessor
 * @description Main deployment pipeline processor with AI review and containerization
 */
module.exports = { processJob };
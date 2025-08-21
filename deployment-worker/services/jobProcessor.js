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
        const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deployments/ai-results`, {
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
        const response = await axios.patch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deployments/${deploymentId}`, {
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
 *   token: 'jwt_token',
 *   enableAiReview: true,
 *   aiModel: 'gpt-3'
 * });
 */
const processJob = async (job) => {
    // Debug: Log the entire job object to see what's being received
    console.log(`[DEBUG] Full job object received:`, JSON.stringify(job, null, 2));
    
    const {
        projectId,
        repoUrl,
        stack,
        subdomain,
        userEmail,
        deploymentId,
        token,
        enableAiReview = false,
        aiModel = 'deepseek_lite'
    } = job;

    console.log(`[DEBUG] Deployment Worker received - enableAiReview: ${enableAiReview}, aiModel: ${aiModel}`);

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
        const repoInfo = await cloneRepo(repoUrl, projectId, 'main');
        const localPath = repoInfo.path;
        logger.info(`Repository cloned to: ${localPath} with unique ID: ${repoInfo.uniqueId}`);

        // Wait for repository to be fully written to disk
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update deployment with commit information
        await updateDeploymentWithCommitInfo(deploymentId, {
            commitHash: repoInfo.commitHash,
            commitMessage: repoInfo.commitMessage,
            author: repoInfo.author,
            commitDate: repoInfo.date
        }, token);

        await logStep(projectId, deploymentId, "setup", `Repository cloned - ${repoInfo.commitMessage.substring(0, 50)}...`, token);

        // Verify repository exists before proceeding
        if (!fs.existsSync(localPath)) {
            throw new Error(`Repository path does not exist: ${localPath}`);
        }

        // === Step 2: AI Review (conditional) ===
        if (enableAiReview) {
            await updateDeploymentStatus(deploymentId, "reviewing", token);
            await logStep(projectId, deploymentId, "ai-review", `Starting AI code review with ${aiModel}`, token);
            
            // AI review can take several minutes - wait for complete analysis (no timeout)
            logger.info("AI analysis in progress - waiting indefinitely until completion...");
            await logStep(projectId, deploymentId, "ai-review", "Analyzing code structure...", token);
            
            // Create progress callback for AI analysis with periodic updates
            const logProgress = async (message) => {
                await logStep(projectId, deploymentId, "ai-review", message, token);
            };
            
            // Add periodic progress updates while waiting
            const progressMessages = [
                "Scanning for security vulnerabilities...",
                "Analyzing code patterns...", 
                "Checking best practices...",
                "Evaluating code quality...",
                "Processing AI insights...",
                "Reviewing architecture...",
                "Validating dependencies..."
            ];
            
            let messageIndex = 0;
            const progressInterval = setInterval(async () => {
                await logStep(projectId, deploymentId, "ai-review", progressMessages[messageIndex % progressMessages.length], token);
                messageIndex++;
            }, 3000); // Update every 3 seconds
            
            try {
                const aiReviewResult = await analyzeRepo(localPath, projectId, aiModel, logProgress);
                clearInterval(progressInterval); // Stop progress updates when analysis completes
                
                await logStep(projectId, deploymentId, "ai-review", "AI analysis completed successfully!", token);
                const { verdict, issues, issueCount, severity_breakdown, linter_count, ai_count } = aiReviewResult;

                // Store AI review results for frontend display
                await updateDeploymentWithAIResults(deploymentId, aiReviewResult, token);
                
                logger.info("AI analysis completed");

                // Debug log the AI review result
                console.log(`[AI Review Debug] Verdict: ${verdict}, Issues: ${issueCount}, Breakdown:`, severity_breakdown);

                // Handle AI verdict flow
                if (verdict === "deny") {
                    await logStep(projectId, deploymentId, "error", `AI denied deployment: Critical issues found`, token);
                    fs.appendFileSync(logPath, `AI_REVIEW_DENIED: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
                    await sendDeploymentNotification(userEmail, projectId, deploymentId, "ai_denied");
                    await updateDeploymentStatus(deploymentId, "failed", token);
                    return;
                }

                if (verdict === "manual_review") {
                    await logStep(projectId, deploymentId, "ai-review", `AI flagged for manual review: ${issueCount} issues found`, token);
                    fs.appendFileSync(logPath, `AI_REVIEW_MANUAL: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
                    await updateDeploymentStatus(deploymentId, "manual_review", token);
                    
                    // Wait for manual override before continuing
                    console.log(`[AI Review] Deployment ${deploymentId} requires manual review - waiting for override`);
                    return; // Stop here until manual override
                }

                // verdict === "approve" - continue with deployment
                await logStep(projectId, deploymentId, "ai-review", `AI review approved: ${issueCount} minor issues found`, token);
            } catch (aiError) {
                clearInterval(progressInterval); // Stop progress updates on error
                console.error('[AI Review Error]:', aiError);
                await logStep(projectId, deploymentId, "ai-review", "AI analysis failed - proceeding with deployment", token);
            }
        } else {
            await logStep(projectId, deploymentId, "setup", "AI code review disabled - proceeding with deployment", token);
        }

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
 * Continue deployment job after manual AI review override
 * @async
 * @function continueJob
 * @param {Object} job - Job continuation parameters
 * @param {string} job.token - JWT authentication token
 * @param {string} job.deploymentId - Unique deployment identifier
 * @param {string} job.projectId - Unique project identifier
 * @param {string} job.repoUrl - Repository URL to deploy
 * @param {string} job.branch - Git branch to deploy
 * @param {string} job.stack - Technology stack (mern, flask, django)
 * @param {string} job.subdomain - Project subdomain
 * @param {Array<Object>} job.envVars - Environment variables
 * @param {string} job.userEmail - User email for notifications
 * @param {boolean} job.skipAiReview - Skip AI review step
 * @returns {Promise<void>} Resolves when deployment continuation is complete
 * @description Continues deployment from environment injection step, skipping AI review
 * @note Called after manual override of AI review manual_review verdict
 */
const continueJob = async (job) => {
    const { token, deploymentId, projectId, repoUrl, branch, stack, subdomain, envVars, userEmail, skipAiReview } = job;
    
    console.log(`[Job Continuation] Starting deployment continuation for ${deploymentId}`);
    
    const logPath = path.join(__dirname, `../logs/deployment_${deploymentId}.log`);
    
    try {
        // Update status to indicate continuation
        await updateDeploymentStatus(deploymentId, "deploying", token);
        await logStep(projectId, deploymentId, "ai-review", "AI review overridden - continuing deployment", token);
        
        // === Step 1: Clone Repository ===
        const localPath = await cloneRepo(repoUrl, branch, projectId, deploymentId, token);
        fs.appendFileSync(logPath, `REPO_CLONED: ${localPath}\n`);
        
        // === Step 2: Skip AI Review (already done) ===
        console.log(`[Job Continuation] Skipping AI review for ${deploymentId}`);
        
        // === Step 3: Environment Variable Injection ===
        await logStep(projectId, deploymentId, "environment", "Setting up environment variables", token);
        
        if (envVars && envVars.length > 0) {
            const envFilePath = path.join(localPath, '.env');
            const envContent = envVars.map(env => `${env.key}=${env.value}`).join('\n');
            fs.writeFileSync(envFilePath, envContent, { encoding: 'utf-8' });
            fs.appendFileSync(logPath, `ENV_VARS_INJECTED: ${envVars.length} variables\n`);
            console.log(`[Environment] Injected ${envVars.length} environment variables`);
        } else {
            console.log(`[Environment] No environment variables to inject`);
        }
        
        // === Step 4: Deploy Container ===
        await logStep(projectId, deploymentId, "deploy", "Building and deploying container", token);
        
        const dockerLog = await deployContainer(localPath, stack, subdomain, projectId);
        fs.appendFileSync(logPath, `DOCKER_DEPLOY: ${dockerLog}\n`);
        
        // Write final log
        fs.writeFileSync(logPath, dockerLog?.toString() || "No Docker log output available.", {
            encoding: "utf-8"
        });
        
        // === Step 5: Finalize ===
        await logStep(projectId, deploymentId, "complete", "Deployment successful", token);
        await updateDeploymentStatus(deploymentId, "success", token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "success");
        
        console.log(`[Job Continuation] Deployment continuation completed successfully for ${deploymentId}`);
        
    } catch (error) {
        // === Step 6: Handle Any Errors ===
        await handleDeploymentError(error, projectId, deploymentId, userEmail, logPath, token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "failed", error.message);
        throw error;
    }
};

/**
 * Export job processing functions
 * @module jobProcessor
 * @description Main deployment pipeline processor with AI review and containerization
 */
module.exports = { processJob, continueJob };
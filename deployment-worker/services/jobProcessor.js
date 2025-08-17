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


// Function to update deployment with AI review results
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

// Function to update deployment with commit information
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
        // Update deployment status to running
        await updateDeploymentStatus(deploymentId, "running", token);
        
        // Send deployment started notification
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "started");
        // === Step 1: Clone Repository ===
        await logStep(projectId, deploymentId, "setup", "Cloning repository");
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

        await logStep(projectId, deploymentId, "setup", `Repository cloned - ${repoInfo.commitMessage.substring(0, 50)}...`);

        // === Step 2: AI Review ===
        await logStep(projectId, deploymentId, "setup", "Starting AI code review");
        const aiReviewResult = await analyzeRepo(localPath, deploymentId);
        const { verdict, issues, issueCount, severity_breakdown, linter_count, ai_count } = aiReviewResult;

        // Store AI review results for frontend display
        await updateDeploymentWithAIResults(deploymentId, aiReviewResult, token);

        if (verdict === "deny") {
            await logStep(projectId, deploymentId, "error", `AI denied deployment: ${severity_breakdown?.security || 0} security, ${severity_breakdown?.error || 0} errors`);
            fs.appendFileSync(logPath, `AI_REVIEW_DENIED: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_denied");
            await updateDeploymentStatus(deploymentId, "failed", token);
            return;
        }

        if (verdict === "manual_review") {
            await logStep(projectId, deploymentId, "warning", `AI flagged for manual review: ${issueCount} issues found (${linter_count} linter, ${ai_count} AI)`);
            fs.appendFileSync(logPath, `AI_REVIEW_MANUAL: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_manual_review");
            await updateDeploymentStatus(deploymentId, "pending_review", token);
            return;
        }

        await logStep(projectId, deploymentId, "setup", `AI review passed: ${issueCount} minor issues found`);

        // === Step 3: Fetch and Inject Environment Variables ===
        await logStep(projectId, deploymentId, "config", "Fetching environment variables");
        const envVars = await fetchEnvVars(projectId, token, logPath);
        const envResult = await injectEnv(localPath, envVars, projectId);

        if (envResult.skipped) {
            await logStep(projectId, deploymentId, "config", "No environment variables - proceeding without .env file");
        } else {
            await logStep(projectId, deploymentId, "config", `Environment configured: ${envResult.variablesCount} variables`);
        }

        // === Step 4: Build and Run Container ===
        await logStep(projectId, deploymentId, "deploy", "Starting container deployment");
        await cleanupExistingContainer(containerName);
        const dockerLog = await deployContainer(localPath, stack, subdomain, projectId, deploymentId);
        
        // Log the custom domain URL
        const PORT_CONFIG = {
            mern: { backend: 12000, frontend: 12001 },
            django: { backend: 13000 },
            flask: { backend: 14000 },
        };
        
        const ports = PORT_CONFIG[stack?.toLowerCase()];
        if (ports) {
            const customUrl = stack?.toLowerCase() === 'mern' && ports.frontend 
                ? `http://localhost:${ports.frontend}`
                : `http://localhost:${ports.backend}`;
            
            await logStep(projectId, deploymentId, "deploy", `Application deployed at: ${customUrl}`);
            logger.info(`Deployment ${deploymentId} accessible at: ${customUrl}`);
        }

        fs.writeFileSync(logPath, dockerLog?.toString() || "No Docker log output available.", {
            encoding: "utf-8"
        });

        // === Step 5: Finalize ===
        await logStep(projectId, deploymentId, "complete", "Deployment successful");
        await updateDeploymentStatus(deploymentId, "success", token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "success");

    } catch (error) {
        // === Step 6: Handle Any Errors ===
        await handleDeploymentError(error, projectId, deploymentId, userEmail, logPath, token);
        await sendDeploymentNotification(userEmail, projectId, deploymentId, "failed", error.message);
        throw error;
    }
};

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
        });

        await updateDeploymentStatus(deploymentId, "failed", token);
        await sendDeploymentNotification(userEmail, projectId, "failed");
    } catch (err) {
        console.error("Error handling failed:", err.message);
    }
};

module.exports = { processJob };
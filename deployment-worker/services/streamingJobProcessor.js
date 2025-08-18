import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { updateDeploymentStatus } from './statusUpdater.js';
import logger, { logStep } from '../utils/logger.js';
import { sendDeploymentNotification } from './emailNotifier.js';
import { injectEnv, fetchEnvVars } from './envInjector.js';
import { deployContainer, cleanupExistingContainer } from '../utils/dockerHelpers.js';
import { analyzeRepo } from './analyzeCode.js';
import { cloneRepo } from './repoCloner.js';
import StreamingLogger from '../utils/streamingLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Process deployment job with real-time streaming logs
 * @param {Object} job - Deployment job data
 * @param {Object} socket - Socket.io connection for real-time streaming
 */
const processJobWithStreaming = async (job, socket = null) => {
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

    // Initialize streaming logger
    const streamLogger = socket ? new StreamingLogger(socket, projectId, deploymentId) : null;

    try {
        // Update deployment status to running
        await updateDeploymentStatus(deploymentId, "running", token);

        if (streamLogger) {
            streamLogger.emitLog("Starting deployment process", 'info', 'init');
        }

        // === Step 1: Clone Repository ===
        await logStep(projectId, deploymentId, "setup", "Cloning repository", token);

        if (streamLogger) {
            streamLogger.emitLog(`Cloning repository: ${repoUrl}`, 'info', 'clone');
        }

        const repoInfo = await cloneRepo(repoUrl, projectId, 'main', socket);
        const localPath = repoInfo.path;

        // Update deployment with commit information
        await updateDeploymentWithCommitInfo(deploymentId, {
            commitHash: repoInfo.commitHash,
            commitMessage: repoInfo.commitMessage,
            author: repoInfo.author,
            commitDate: repoInfo.date
        }, token);

        await logStep(projectId, deploymentId, "setup", `Repository cloned - ${repoInfo.commitMessage.substring(0, 50)}...`, token);

        // === Step 2: AI Review ===
        await logStep(projectId, deploymentId, "setup", "Starting AI code review", token);

        if (streamLogger) {
            streamLogger.emitLog("🤖 Starting AI code review", 'info', 'ai-review');
        }

        const aiReviewResult = await analyzeRepo(localPath, deploymentId);
        const { verdict, issues, issueCount, severity_breakdown, linter_count, ai_count } = aiReviewResult;

        // Store AI review results for frontend display
        await updateDeploymentWithAIResults(deploymentId, aiReviewResult, token);

        if (verdict === "deny") {
            const denyMessage = `AI denied deployment: ${severity_breakdown?.security || 0} security, ${severity_breakdown?.error || 0} errors`;
            await logStep(projectId, deploymentId, "error", denyMessage, token);

            if (streamLogger) {
                streamLogger.emitLog(`ERROR: ${denyMessage}`, 'error', 'ai-review');
            }

            fs.appendFileSync(logPath, `AI_REVIEW_DENIED: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_denied");
            await updateDeploymentStatus(deploymentId, "failed", token);
            return;
        }

        if (verdict === "manual_review") {
            const manualMessage = `AI flagged for manual review: ${issueCount} issues found (${linter_count} linter, ${ai_count} AI)`;
            await logStep(projectId, deploymentId, "warning", manualMessage, token);

            if (streamLogger) {
                streamLogger.emitLog(`WARNING: ${manualMessage}`, 'warning', 'ai-review');
            }

            fs.appendFileSync(logPath, `AI_REVIEW_MANUAL: ${JSON.stringify(aiReviewResult, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_manual_review");
            await updateDeploymentStatus(deploymentId, "pending_review", token);
            return;
        }

        const passMessage = `AI review passed: ${issueCount} minor issues found`;
        await logStep(projectId, deploymentId, "setup", passMessage, token);

        if (streamLogger) {
            streamLogger.emitLog(`SUCCESS: ${passMessage}`, 'success', 'ai-review');
        }

        // === Step 3: Fetch and Inject Environment Variables ===
        await logStep(projectId, deploymentId, "config", "Fetching environment variables", token);

        if (streamLogger) {
            streamLogger.emitLog("Configuring environment variables", 'info', 'config');
        }

        const envVars = await fetchEnvVars(projectId, token, logPath);
        const envResult = await injectEnv(localPath, envVars, projectId);

        if (envResult.skipped) {
            const skipMessage = "No environment variables - proceeding without .env file";
            await logStep(projectId, deploymentId, "config", skipMessage, token);

            if (streamLogger) {
                streamLogger.emitLog(`ℹ️ ${skipMessage}`, 'info', 'config');
            }
        } else {
            const configMessage = `Environment configured: ${envResult.variablesCount} variables`;
            await logStep(projectId, deploymentId, "config", configMessage, token);

            if (streamLogger) {
                streamLogger.emitLog(`SUCCESS: ${configMessage}`, 'success', 'config');
            }
        }

        // === Step 4: Build and Run Container ===
        await logStep(projectId, deploymentId, "deploy", "Starting container deployment", token);

        if (streamLogger) {
            streamLogger.emitLog("Starting Docker deployment", 'info', 'deploy');
        }

        await cleanupExistingContainer(containerName);
        const dockerResult = await deployContainer(localPath, stack, subdomain, projectId, deploymentId, socket);

        // Write deployment log for backward compatibility
        fs.writeFileSync(logPath, `Deployment completed successfully at ${new Date().toISOString()}`, {
            encoding: "utf-8"
        });

        // === Step 5: Finalize ===
        const successMessage = "Deployment successful";
        await logStep(projectId, deploymentId, "complete", successMessage, token);

        if (streamLogger) {
            streamLogger.emitLog(`SUCCESS: ${successMessage}`, 'success', 'complete');
        }

        await updateDeploymentStatus(deploymentId, "success", token);
        await sendDeploymentNotification(userEmail, projectId, "success");

    } catch (error) {
        // === Step 6: Handle Any Errors ===
        if (streamLogger) {
            streamLogger.emitLog(`DEPLOYMENT FAILED: ${error.message}`, 'error', 'error');
        }

        await handleDeploymentError(error, projectId, deploymentId, userEmail, logPath, token, streamLogger);
        throw error;
    }
};

const handleDeploymentError = async (error, projectId, deploymentId, userEmail, logPath, token, streamLogger = null) => {
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    fs.appendFileSync(logPath, `DEPLOYMENT_ERROR: ${JSON.stringify(errorDetails)}\n`);

    if (streamLogger) {
        streamLogger.emitLog(`Error details: ${error.message}`, 'error', 'error');
    }

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

        if (streamLogger) {
            streamLogger.emitLog(`Failed to update error status: ${err.message}`, 'error', 'error');
        }
    }
};

export { processJobWithStreaming };

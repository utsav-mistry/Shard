const fs = require("fs");
const path = require("path");
const { cloneRepo } = require("./repoCloner");
const { injectEnv } = require("./envInjector");
const { buildAndRunContainer } = require("../utils/dockerHelpers");
const { sendDeploymentNotification } = require("./emailNotifier");
const axios = require("axios");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const analyzeRepo = require('./analyzeCode')

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
        // === Step 1: Clone Repository ===
        await logStep(projectId, deploymentId, "setup", "Cloning repository");
        const localPath = await cloneRepo(repoUrl, projectId);
        await logStep(projectId, deploymentId, "setup", "Repository cloned");

        // === Step 2: AI Review ===
        await logStep(projectId, deploymentId, "setup", "Starting AI code review");
        const { verdict, issues, issueCount, error: aiError } = await analyzeRepo(localPath, deploymentId);

        if (verdict === "deny") {
            await logStep(projectId, deploymentId, "error", `AI denied deployment (${issueCount} issues)`);
            fs.appendFileSync(logPath, `AI_REVIEW_DENIED: ${JSON.stringify(issues, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_denied");
            return;
        }

        if (verdict === "manual_review") {
            await logStep(projectId, deploymentId, "error", `AI flagged for manual review (${issueCount} issues)`);
            fs.appendFileSync(logPath, `AI_REVIEW_MANUAL: ${JSON.stringify(issues, null, 2)}\n`);
            await sendDeploymentNotification(userEmail, projectId, "ai_manual_review");
            return;
        }

        await logStep(projectId, deploymentId, "setup", "AI review passed");

        // === Step 3: Fetch and Inject Environment Variables ===
        await logStep(projectId, deploymentId, "config", "Fetching environment variables");
        const envVars = await fetchEnvVars(projectId, token, logPath);
        await injectEnv(localPath, envVars, projectId);
        await logStep(projectId, deploymentId, "config", "Environment configured");

        // === Step 4: Build and Run Container ===
        await logStep(projectId, deploymentId, "deploy", "Starting container deployment");
        await cleanupExistingContainer(containerName);
        const dockerLog = await deployContainer(localPath, stack, subdomain, projectId, deploymentId);

        fs.writeFileSync(logPath, dockerLog?.toString() || "No Docker log output available.", {
            encoding: "utf-8"
        });

        // === Step 5: Finalize ===
        await logStep(projectId, deploymentId, "complete", "Deployment successful");
        await notifySuccess(userEmail, projectId);

    } catch (error) {
        // === Step 6: Handle Any Errors ===
        await handleDeploymentError(error, projectId, deploymentId, userEmail, logPath);
        throw error;
    }
};


const fetchEnvVars = async (projectId, token, logPath) => {
    try {
        const { data } = await axios.get(`http://localhost:5000/env/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: CONFIG.API_TIMEOUT
        });
        return data;
    } catch (err) {
        const errorDetails = {
            status: err.response?.status,
            message: err.response?.data?.message || err.message,
            timestamp: new Date().toISOString()
        };
        fs.appendFileSync(logPath, `ENV_FETCH_ERROR: ${JSON.stringify(errorDetails)}\n`);
        throw new Error(`Environment fetch failed: ${errorDetails.message}`);
    }
};

const cleanupExistingContainer = async (containerName) => {
    try {
        await exec(`docker rm -f ${containerName}`, { timeout: CONFIG.DOCKER_TIMEOUT });
    } catch (err) {
        if (!err.message.includes("No such container")) {
            throw err;
        }
    }
};

const deployContainer = async (localPath, stack, subdomain, projectId, deploymentId) => {
    return await buildAndRunContainer({
        localPath,
        stack,
        subdomain,
        projectId,
        deploymentId
    });
};
const logStep = async (projectId, deploymentId, type, content) => {
    const validTypes = ["setup", "config", "deploy", "runtime", "error", "complete"];
    const safeType = validTypes.includes(type) ? type : "runtime"; // default fallback

    try {
        await axios.post("http://localhost:5000/logs", {
            projectId,
            deploymentId,
            type: safeType,
            content,
            timestamp: new Date().toISOString()
        }, {
            timeout: 5000
        });
    } catch (err) {
        console.error("Logging failed:", err.message);
    }
};


const notifySuccess = async (userEmail, projectId) => {
    try {
        await sendDeploymentNotification(userEmail, projectId, "success");
    } catch (err) {
        console.error("Success notification failed:", err.message);
    }
};

const handleDeploymentError = async (error, projectId, deploymentId, userEmail, logPath) => {
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    fs.appendFileSync(logPath, `DEPLOYMENT_ERROR: ${JSON.stringify(errorDetails)}\n`);

    try {
        await axios.post("http://localhost:5000/logs", {
            projectId,
            deploymentId,
            type: "error",
            content: `Deployment failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });

        await sendDeploymentNotification(userEmail, projectId, "failed");
    } catch (err) {
        console.error("Error handling failed:", err.message);
    }
};

module.exports = { processJob };
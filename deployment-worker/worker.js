const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { addJob, getNextJob } = require("./queue");
const { processJob } = require("./services/jobProcessor");

const app = express();
const POLL_INTERVAL = 5000;
const LOG_DIR = path.join(__dirname, "logs");

// === Startup Message ===
console.log("Shard Deployment Worker started...");

// === Ensure Log Directory Exists ===
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log("Created logs directory at:", LOG_DIR);
}

app.use(bodyParser.json());

// === Job Queue API ===
app.post("/queue", async (req, res) => {
    const job = req.body;

    if (!job.projectId || !job.repoUrl || !job.stack || !job.subdomain || !job.token) {
        return res.status(400).json({ message: "Missing required job fields" });
    }

    console.log(`Received job for project: ${job.projectId}`);
    addJob(job);
    res.status(200).json({ message: "Job added to queue" });
});

// === Worker Loop ===
const startWorker = async () => {
    while (true) {
        const job = getNextJob();
        if (job) {
            console.log(`Processing job: ${job.projectId}`);
            try {
                await processJob(job);
                console.log(`Job completed: ${job.projectId}`);
            } catch (err) {
                console.error(`Job failed: ${job.projectId}`);
                console.error(err.stack);
            }
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
};

// === Start API + Worker ===
app.listen(9000, () => {
    console.log("Worker API listening on port 9000");
    startWorker();
});

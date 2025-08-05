const axios = require("axios");

// This is your worker's job queue API endpoint
const WORKER_QUEUE_URL = process.env.WORKER_QUEUE_URL || "http://localhost:9000/queue";

const queueJob = async (jobData) => {
    try {
        const response = await axios.post(WORKER_QUEUE_URL, jobData);
        console.log("Job successfully queued to worker");
        return response.data;
    } catch (err) {
        console.error("Failed to queue job:", err.message);
        throw err;
    }
};

module.exports = { queueJob };

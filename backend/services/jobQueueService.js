/**
 * @fileoverview Job Queue Service
 * @description Handles job queuing to deployment worker service
 * @module services/jobQueueService
 * @requires axios
 * @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require("axios");

// This is your worker's job queue API endpoint
const WORKER_QUEUE_URL = process.env.WORKER_QUEUE_URL || "http://localhost:9000/queue";

/**
 * Queues a job to the deployment worker
 * @async
 * @function queueJob
 * @param {Object} jobData - Job data to be processed by worker
 * @returns {Promise<Object>} Response from worker queue
 * @throws {Error} If job queueing fails
 * @example
 * await queueJob({ type: 'deployment', projectId: '123', repoUrl: 'github.com/user/repo' });
 */
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

/**
 * @namespace jobQueueService
 * @description Service for queuing jobs to deployment worker
 */
module.exports = { queueJob };

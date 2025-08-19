/**
 * @fileoverview Simple Job Queue
 * @description Basic in-memory job queue for deployment worker with FIFO processing
 * @author Utsav Mistry
 * @version 0.2.3
 */

/**
 * In-memory job queue array
 * @type {Array<Object>}
 * @description Stores pending deployment jobs in FIFO order
 */
const queue = [];

/**
 * Processing state flag
 * @type {boolean}
 * @description Indicates if a job is currently being processed
 */
let isProcessing = false;

/**
 * Add a new job to the deployment queue
 * @function addJob
 * @param {Object} job - Job object to add to queue
 * @param {string} job.projectId - Project ID for the deployment
 * @param {string} job.repoUrl - Repository URL to deploy
 * @param {string} job.stack - Technology stack (mern, flask, django)
 * @param {string} job.subdomain - Project subdomain
 * @param {string} job.token - Authentication token
 * @returns {void}
 * @description Adds job to queue with unique ID and timestamp
 * @note Jobs are processed in FIFO order
 */
const addJob = (job) => {
    queue.push({
        ...job,
        id: Date.now() + Math.random(),
        addedAt: new Date(),
        status: 'pending'
    });
    console.log(`[Queue] Job added for project ${job.projectId}. Queue length: ${queue.length}`);
};

/**
 * Get and remove the next job from the queue
 * @function getNextJob
 * @returns {Object|null} Next job to process or null if queue is empty
 * @description Retrieves next job in FIFO order and marks it as processing
 * @note Updates job status and adds startedAt timestamp
 */
const getNextJob = () => {
    if (queue.length === 0) {
        return null;
    }

    const job = queue.shift();
    job.status = 'processing';
    job.startedAt = new Date();

    console.log(`[Queue] Processing job for project ${job.projectId}. Remaining jobs: ${queue.length}`);
    return job;
};

/**
 * Get current queue status and statistics
 * @function getQueueStatus
 * @returns {Object} Queue status information
 * @returns {number} returns.pending - Number of pending jobs
 * @returns {boolean} returns.isProcessing - Whether a job is currently processing
 * @returns {Array<Object>} returns.jobs - Array of job summaries
 * @description Provides queue monitoring and status information
 */
const getQueueStatus = () => {
    return {
        pending: queue.length,
        isProcessing,
        jobs: queue.map(job => ({
            projectId: job.projectId,
            addedAt: job.addedAt,
            status: job.status
        }))
    };
};

/**
 * Export queue management functions
 * @module queue
 * @description Simple FIFO job queue for deployment processing
 */
module.exports = { addJob, getNextJob, getQueueStatus };

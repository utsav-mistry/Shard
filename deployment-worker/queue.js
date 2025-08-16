const queue = [];
let isProcessing = false;

const addJob = (job) => {
    queue.push({
        ...job,
        id: Date.now() + Math.random(),
        addedAt: new Date(),
        status: 'pending'
    });
    console.log(`[Queue] Job added for project ${job.projectId}. Queue length: ${queue.length}`);
};

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

export { addJob, getNextJob, getQueueStatus };

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

class JobQueue extends EventEmitter {
  constructor(concurrency = 3) {
    super();
    this.queue = [];
    this.activeJobs = new Map();
    this.concurrency = concurrency;
    this.isShuttingDown = false;
    this.paused = false;
    this.drainResolvers = [];
  }

  /**
   * Add a job to the queue
   * @param {Object} job - The job to add
   * @param {Object} [options] - Job options
   * @param {number} [options.priority=0] - Job priority (higher = higher priority)
   * @param {number} [options.timeout=0] - Job timeout in ms (0 = no timeout)
   * @returns {string} Job ID
   */
  add(job, { priority = 0, timeout = 0 } = {}) {
    if (this.isShuttingDown) {
      throw new Error('Cannot add job: Queue is shutting down');
    }

    const jobId = uuidv4();
    const jobWithMeta = {
      id: jobId,
      data: job,
      priority,
      timeout,
      status: 'pending',
      addedAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.queue.push(jobWithMeta);
    // Sort by priority (highest first) and then by insertion time (oldest first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.addedAt - b.addedAt;
    });

    logger.info(`Job ${jobId} added to queue`, { queueLength: this.queue.length });
    this.emit('jobAdded', jobId, jobWithMeta);
    this.processQueue();

    return jobId;
  }

  /**
   * Process the next job in the queue
   * @private
   */
  async processQueue() {
    // Prevent concurrent processing calls
    if (this._processing) return;
    this._processing = true;

    try {
      while (!this.paused && !this.isShuttingDown && 
             this.activeJobs.size < this.concurrency && 
             this.queue.length > 0) {
        
        const job = this.queue.shift();
        job.status = 'active';
        job.startedAt = new Date();
        job.attempts += 1;

        const jobId = job.id;
        this.activeJobs.set(jobId, job);

        logger.info(`Starting job ${jobId}`, { jobId, attempts: job.attempts });
        this.emit('jobStart', jobId, job);

        // Process job asynchronously
        this._processJobAsync(job);
      }

      // Check if queue is drained
      if (this.queue.length === 0 && this.activeJobs.size === 0) {
        this.emit('drain');
        this.drainResolvers.forEach(resolve => resolve());
        this.drainResolvers = [];
      }
    } finally {
      this._processing = false;
    }
  }

  /**
   * Process a single job asynchronously
   * @private
   */
  async _processJobAsync(job) {
    const jobId = job.id;

    let timeoutId;
    try {
      if (job.timeout > 0) {
        await Promise.race([
          this.processJob(job),
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Job ${jobId} timed out after ${job.timeout}ms`));
            }, job.timeout);
          })
        ]);
      } else {
        await this.processJob(job);
      }

      // Job completed successfully
      job.status = 'completed';
      job.finishedAt = new Date();
      logger.info(`Job ${jobId} completed successfully`, { 
        duration: job.finishedAt - job.startedAt,
        jobId 
      });
      this.emit('jobComplete', jobId, job);
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.finishedAt = new Date();
      
      if (job.attempts < job.maxAttempts) {
        logger.warn(`Job ${jobId} failed, retrying (attempt ${job.attempts}/${job.maxAttempts})`, { 
          error: error.message,
          jobId,
          stack: error.stack 
        });
        
        // Requeue with backoff
        const backoffTime = Math.min(1000 * Math.pow(2, job.attempts - 1), 30000);
        setTimeout(() => {
          job.status = 'pending';
          this.queue.unshift(job);
          this.processQueue();
        }, backoffTime);
      } else {
        logger.error(`Job ${jobId} failed after ${job.attempts} attempts`, { 
          error: error.message,
          jobId,
          stack: error.stack 
        });
        this.emit('jobFailed', jobId, job, error);
      }
    } finally {
      clearTimeout(timeoutId);
      this.activeJobs.delete(jobId);
      // Process next job in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Process a job (to be overridden by subclasses)
   * @param {Object} job - The job to process
   * @abstract
   */
  async processJob(job) {
    throw new Error('processJob must be implemented by subclasses');
  }

  /**
   * Pause the queue
   */
  pause() {
    this.paused = true;
    logger.info('Queue paused');
    this.emit('paused');
  }

  /**
   * Resume the queue
   */
  resume() {
    this.paused = false;
    logger.info('Queue resumed');
    this.emit('resumed');
    this.processQueue();
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      concurrency: this.concurrency,
      isPaused: this.paused,
      isShuttingDown: this.isShuttingDown,
      stats: {
        pending: this.queue.length,
        active: this.activeJobs.size,
        completed: 0, // Would need to track completed jobs for this
        failed: 0,    // Would need to track failed jobs for this
        waiting: Math.max(0, this.queue.length - this.concurrency)
      }
    };
  }

  /**
   * Wait for the queue to be empty
   * @returns {Promise} Resolves when the queue is empty
   */
  async onDrain() {
    if (this.queue.length === 0 && this.activeJobs.size === 0) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.drainResolvers.push(resolve);
    });
  }

  /**
   * Gracefully shut down the queue
   * @param {Object} [options] - Shutdown options
   * @param {number} [options.timeout=30000] - Time to wait for jobs to complete
   * @returns {Promise} Resolves when shutdown is complete
   */
  async shutdown({ timeout = 30000 } = {}) {
    if (this.isShuttingDown) return;
    
    logger.info('Initiating queue shutdown...');
    this.isShuttingDown = true;
    this.pause();

    try {
      // Wait for active jobs to complete
      if (this.activeJobs.size > 0) {
        logger.info(`Waiting for ${this.activeJobs.size} active jobs to complete...`);
        await Promise.race([
          Promise.all(Array.from(this.activeJobs.values()).map(job => 
            new Promise(resolve => this.once(`jobComplete:${job.id}`, resolve))
              .catch(() => {}) // Ignore errors during shutdown
          )),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Shutdown timed out')), timeout)
          )
        ]);
      }
      
      logger.info('Queue shutdown complete');
      this.emit('shutdown');
    } catch (error) {
      logger.error('Error during queue shutdown:', error);
      throw error;
    }
  }
}

export default JobQueue;

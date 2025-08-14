import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import logger from './utils/logger.js';
import JobQueue from './services/queueService.js';
import { processJob } from './services/jobProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9000;

// Configuration
const config = {
  concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10),
  jobTimeout: parseInt(process.env.JOB_TIMEOUT || '900000', 10), // 15 minutes
  requestLimit: process.env.REQUEST_LIMIT || '10mb',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

// Ensure required directories exist
const requiredDirs = [
  process.env.LOG_DIR || 'logs',
  'repos',
  'builds'
];

for (const dir of requiredDirs) {
  fs.ensureDirSync(dir);
  logger.info(`Ensured directory exists: ${path.resolve(dir)}`);
}

// Setup Express middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: config.requestLimit }));
app.use(express.urlencoded({ extended: true, limit: config.requestLimit }));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request ID and logging
app.use((req, res, next) => {
  req.id = req.get('X-Request-Id') || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Initialize job queue
const deploymentQueue = new JobQueue({
  concurrency: config.concurrency,
  processJob: async (job) => {
    try {
      logger.info(`Processing job ${job.id} for project ${job.data.projectId}`);
      await processJob(job.data);
      return { status: 'completed' };
    } catch (error) {
      logger.error(`Job ${job.id} failed: ${error.message}`, {
        error: error.stack,
        jobId: job.id,
        projectId: job.data.projectId
      });
      throw error; // Will trigger retry logic in the queue
    }
  }
});

// Make queue available to routes
app.set('queue', deploymentQueue);

// Import routes
import healthRoutes from './routes/health.js';

// API Routes
app.use('/health', healthRoutes);

// Job submission endpoint
app.post('/api/jobs', async (req, res) => {
  const job = req.body;

  // Validate required fields
  if (!job.projectId || !job.repoUrl || !job.stack || !job.subdomain || !job.token) {
    return res.status(400).json({
      error: 'Missing required job fields',
      required: ['projectId', 'repoUrl', 'stack', 'subdomain', 'token']
    });
  }

  try {
    const jobId = deploymentQueue.add(job, {
      priority: job.priority || 0,
      timeout: job.timeout || config.jobTimeout
    });

    logger.info(`Job ${jobId} queued for project ${job.projectId}`, {
      jobId,
      projectId: job.projectId,
      subdomain: job.subdomain
    });

    res.status(202).json({
      jobId,
      status: 'queued',
      timestamp: new Date().toISOString(),
      links: {
        status: `/api/jobs/${jobId}`,
        cancel: `/api/jobs/${jobId}/cancel`
      }
    });
  } catch (error) {
    logger.error('Failed to queue job', {
      error: error.message,
      stack: error.stack,
      projectId: job.projectId
    });

    res.status(500).json({
      error: 'Failed to queue job',
      message: error.message
    });
  }
});

// Job status endpoint
app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = deploymentQueue.activeJobs.get(jobId) ||
    deploymentQueue.queue.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress || 0,
    addedAt: job.addedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    attempts: job.attempts,
    error: job.error
  });
});

// Track if we're in the process of shutting down
let isShuttingDown = false;

// Enhanced console logging for shutdown with colors and timestamps
const shutdownLog = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const formattedTime = chalk.gray(`[${timestamp}]`);

  switch (type) {
    case 'start':
      console.log(`${formattedTime} ${chalk.white.bgRed.bold('🚦 DEPLOYMENT WORKER SHUTDOWN INITIATED')}`);
      console.log(`${formattedTime} ${chalk.black.bgCyan(` ⚡ ${message} `)}`);
      break;
    case 'step':
      console.log(`${formattedTime} ${chalk.black.bgCyan(` ⚡ ${message} `)}`);
      break;
    case 'success':
      console.log(`${formattedTime} ${chalk.green(`✅ ${message}`)}`);
      break;
    case 'error':
      console.log(`${formattedTime} ${chalk.red.bold(`❌ ${message}`)}`);
      break;
    case 'warn':
      console.log(`${formattedTime} ${chalk.yellow(`⚠️  ${message}`)}`);
      break;
    case 'complete':
      console.log(`${formattedTime} ${chalk.green.bold('👋 DEPLOYMENT WORKER SHUTDOWN COMPLETE')}`);
      console.log(`${formattedTime} ${chalk.green(`${message}`)}`);
      break;
    case 'queue':
      console.log(`${formattedTime} ${chalk.blue(`🔄 ${message}`)}`);
      break;
    default:
      console.log(`${formattedTime} ${chalk.cyan(message)}`);
  }

  // Also log to winston logger
  logger.info(message);
};

/**
 * Graceful shutdown handler
 * @param {Object} [options] - Shutdown options
 * @param {number} [options.timeout=30000] - Time to wait for active jobs to complete
 * @returns {Promise<{success: boolean, message: string}>} Shutdown result
 */
const gracefulShutdown = async (options = {}) => {
  if (isShuttingDown) {
    return { success: false, message: 'Shutdown already in progress' };
  }

  isShuttingDown = true;
  const { timeout = 30000 } = options;
  const shutdownStartTime = new Date();

  shutdownLog('Starting graceful shutdown...', 'start');

  try {
    // Check active jobs before shutdown
    const activeJobs = deploymentQueue.activeJobs.size;
    const queuedJobs = deploymentQueue.queue.length;

    if (activeJobs > 0 || queuedJobs > 0) {
      shutdownLog(`Found ${activeJobs} active jobs and ${queuedJobs} queued jobs`, 'queue');
      shutdownLog('Waiting for active jobs to complete...', 'step');
    }

    // Stop accepting new connections
    await new Promise((resolve) => {
      server.close(() => {
        shutdownLog('HTTP server closed - no new connections accepted', 'step');
        resolve();
      });

      // Force close server after timeout
      setTimeout(() => {
        shutdownLog('Server close timeout, forcing shutdown', 'warn');
        resolve();
      }, timeout);
    });

    // Shutdown the queue (will wait for active jobs to complete)
    shutdownLog('Shutting down job queue...', 'step');
    await deploymentQueue.shutdown({ timeout });
    shutdownLog('Job queue shutdown complete', 'success');

    const shutdownDuration = new Date() - shutdownStartTime;
    shutdownLog(`Shutdown completed in ${shutdownDuration}ms`, 'complete');
    return { success: true, message: 'Shutdown completed successfully' };
  } catch (error) {
    const errorMsg = `Error during shutdown: ${error.message}`;
    shutdownLog(errorMsg, 'error');
    return { success: false, message: errorMsg };
  }
};

// Add shutdown endpoint
app.post('/api/shutdown', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.get('X-Shutdown-Token') !== process.env.SHUTDOWN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await gracefulShutdown({ timeout: 15000 });

  if (result.success) {
    res.json({ message: result.message });
    // Give time for the response to be sent
    setTimeout(() => process.exit(0), 100);
  } else {
    res.status(500).json({ error: result.message });
  }
});

// Handle process signals for local development
if (process.env.NODE_ENV !== 'test') {
  const handleSignal = (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    gracefulShutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };

  process.on('SIGTERM', handleSignal);
  process.on('SIGINT', handleSignal);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit immediately, let the process manager handle it
});

// Start the server
const startServer = async () => {
  try {
    await new Promise((resolve) => {
      server.listen(PORT, () => {
        const address = server.address();
        const host = typeof address === 'string' ? address : `${address.address}:${address.port}`;

        logger.info(`Deployment worker started on http://${host}`, {
          pid: process.pid,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          config
        });

        resolve();
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the application
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    logger.error('Fatal error during startup', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

export { app, deploymentQueue, startServer, gracefulShutdown };

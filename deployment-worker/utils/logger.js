const winston = require('winston');
const { format } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const axios = require('axios');

const { combine, timestamp, printf, colorize, errors } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  const stackTrace = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}${stackTrace}`;
});

// Create transports
const transports = [
  // Console transport with colors
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      printf(({ level, message, timestamp, ...meta }) => {
        const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level}: ${message}${metaString}`;
      })
    ),
    level: process.env.LOG_LEVEL || 'info',
  }),
  
  // Daily rotate file transport
  new winston.transports.DailyRotateFile({
    filename: path.join(process.env.LOG_DIR || 'logs', 'deployment-worker-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(
      timestamp(),
      logFormat
    ),
    level: process.env.LOG_LEVEL || 'info',
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'deployment-worker' },
  transports,
  exitOnError: false, // Don't exit on handled exceptions
});

// Handle uncaught exceptions
if (process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't exit immediately, let the process manager handle it
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
  });
}

// Add stream for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper function to log deployment steps
const logStep = async (projectId, deploymentId, step, message) => {
  const logMessage = `[Project: ${projectId}] [Deployment: ${deploymentId}] ${step.toUpperCase()}: ${message}`;
  logger.info(logMessage);
  
  // If we have a deployment ID, update the deployment status in the database
  if (deploymentId) {
    try {
      await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deploy/update-step`, {
        deploymentId,
        step,
        message
      });
    } catch (error) {
      logger.error(`Failed to update deployment step: ${error.message}`);
    }
  }
};

module.exports = logger;
module.exports.logStep = logStep;
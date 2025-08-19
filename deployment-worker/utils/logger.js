/**
 * @fileoverview Winston Logger Configuration
 * @description Centralized logging system for deployment worker with file rotation and step tracking
 * @author Utsav Mistry
 * @version 0.2.3
 */

const winston = require('winston');
const { format } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const axios = require('axios');

const { combine, timestamp, printf, colorize, errors } = format;

/**
 * Custom log format for structured logging
 * @type {winston.Logform.Format}
 * @description Formats log entries with timestamp, level, message, metadata, and stack traces
 */
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  const stackTrace = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}${stackTrace}`;
});

/**
 * Winston transport configurations
 * @type {Array<winston.transport>}
 * @description Console and daily rotating file transports for comprehensive logging
 */
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

/**
 * Main Winston logger instance
 * @type {winston.Logger}
 * @description Configured logger with console and file outputs, error handling, and metadata
 */
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

/**
 * Production error handling setup
 * @description Handles uncaught exceptions and unhandled promise rejections in production
 */
if (process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't exit immediately, let the process manager handle it
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
  });
}

/**
 * Morgan HTTP request logging stream
 * @type {Object}
 * @property {Function} write - Stream write function for Morgan middleware
 * @description Integrates Morgan HTTP request logging with Winston logger
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Log deployment step with backend synchronization
 * @async
 * @function logStep
 * @param {string} projectId - Unique project identifier
 * @param {string} deploymentId - Unique deployment identifier
 * @param {string} step - Deployment step name (setup, config, deploy, complete, error)
 * @param {string} message - Step description or status message
 * @param {string} [token=null] - JWT authentication token for backend updates
 * @returns {Promise<void>} Resolves when logging is complete
 * @description Logs deployment step locally and optionally syncs with backend database.
 * Provides structured logging for deployment pipeline tracking and debugging.
 * @example
 * await logStep('proj123', 'deploy456', 'setup', 'Cloning repository', token);
 * await logStep('proj123', 'deploy456', 'error', 'Build failed', token);
 */
const logStep = async (projectId, deploymentId, step, message, token = null) => {
  const logMessage = `[Project: ${projectId}] [Deployment: ${deploymentId}] ${step.toUpperCase()}: ${message}`;
  logger.info(logMessage);
  
  // If we have a deployment ID and token, update the deployment status in the database
  if (deploymentId && token) {
    try {
      await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/deploy/update-step`, {
        deploymentId,
        step,
        message
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
    } catch (error) {
      logger.error(`Failed to update deployment step: ${error.message}`);
    }
  }
};

/**
 * Export logger and utilities
 * @module logger
 * @description Winston logger with deployment step tracking and HTTP request logging support
 */
module.exports = logger;
module.exports.logStep = logStep;
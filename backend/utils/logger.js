/**
 * @fileoverview Logging Utility
 * @description Configures and exports a Winston logger with file rotation,
 * console output, and structured logging capabilities
 * @module utils/logger
 * @requires winston
 * @requires path
 * @requires fs
 * @author Utsav Mistry
 * @version 1.0.0
 */

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom log levels for the application
 * @enum {number}
 */
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    silly: 5
};

/**
 * Custom colors for log levels
 * @enum {string}
 */
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    silly: 'gray'
};

// Add colors to winston
winston.addColors(colors);

/**
 * Custom format for console output
 * @private
 * @function consoleFormat
 * @param {Object} info - Log information object
 * @param {string} info.level - Log level
 * @param {string} info.message - Log message
 * @param {string} info.timestamp - Timestamp
 * @param {string} [info.stack] - Error stack trace if available
 * @returns {string} Formatted log message
 */
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add stack trace if available
    if (stack) {
        msg += `\n${stack}`;
    }

    // Add additional metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
        try {
            const cleanMeta = {};
            for (const key of metaKeys) {
                if (key !== 'timestamp' && key !== 'level' && key !== 'message' && key !== 'stack') {
                    cleanMeta[key] = meta[key];
                }
            }
            if (Object.keys(cleanMeta).length > 0) {
                msg += ` \n${JSON.stringify(cleanMeta, null, 2)}`;
            }
        } catch (e) {
            msg += ' [Error parsing metadata]';
        }
    }

    return msg;
});

/**
 * Main logger instance configured with multiple transports
 * @type {winston.Logger}
 * @example
 * // Basic usage
 * logger.info('Server started on port 3000');
 * 
 * // With metadata
 * logger.warn('High memory usage', { memory: process.memoryUsage() });
 * 
 * // Error logging with stack trace
 * try {
 *   // Some code that might throw
 * } catch (error) {
 *   logger.error('Operation failed', error);
 * }
 */
const logger = createLogger({
    levels,
    level: process.env.LOG_LEVEL || 'INFO',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'shard-backend' },
    transports: [
        // Console transport with colors
        new transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleFormat
            ),
            level: process.env.CONSOLE_LOG_LEVEL || 'DEBUG'
        }),

        // Error logs file
        new transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),

        // Combined logs file
        new transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),

        // HTTP request logs
        new transports.File({
            filename: path.join(logDir, 'http.log'),
            level: 'http',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        })
    ],
    exitOnError: false // Don't exit on handled exceptions
});

// Create a stream for morgan (HTTP request logging)
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// Handle uncaught exceptions
if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        // In production, you might want to restart the process here
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // In production, you might want to restart the process here
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });
}

module.exports = logger;

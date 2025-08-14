import winston from 'winston';
import { format } from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export default logger;

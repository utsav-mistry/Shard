const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connection state tracking
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Connection options with pooling and timeouts
const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 3000, // Timeout after 3s for server selection
    connectTimeoutMS: 5000, // Timeout after 5s for initial connection
    socketTimeoutMS: 10000, // Close sockets after 10s of inactivity
    heartbeatFrequencyMS: 3000, // Check server status every 3s
    maxPoolSize: 5, // Reduced from 10 to 5 for development
    minPoolSize: 1,
    maxIdleTimeMS: 10000,
    retryWrites: true,
    w: 'majority',
    // Disable buffering to fail fast
    bufferCommands: false,
    // Disable auto-reconnect in development to fail fast
    autoReconnect: process.env.NODE_ENV === 'production',
    // Enable debug logging in development
    loggerLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
};

// Handle MongoDB connection events
const setupMongoEventHandlers = () => {
    mongoose.connection.on('connected', () => {
        isConnected = true;
        connectionRetries = 0;
        logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
        isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        isConnected = true;
        connectionRetries = 0;
    });

    mongoose.connection.on('reconnectFailed', () => {
        logger.error('MongoDB reconnection failed');
        isConnected = false;
    });
};

/**
 * Establishes a connection to MongoDB with retry logic
 * @returns {Promise<Mongoose>} Mongoose instance
 */
const connectDB = async (retryCount = 0) => {
    if (isConnected) {
        logger.debug('Using existing database connection');
        return mongoose;
    }

    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, connectionOptions);
        setupMongoEventHandlers();
        return mongoose;
    } catch (error) {
        connectionRetries++;
        
        if (connectionRetries <= MAX_RETRIES) {
            logger.warn(
                `MongoDB connection attempt ${connectionRetries}/${MAX_RETRIES} failed: ${error.message}`
            );
            
            // Wait before retrying with exponential backoff
            const delay = Math.min(RETRY_DELAY * Math.pow(2, connectionRetries - 1), 30000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return connectDB(retryCount + 1);
        }
        
        logger.error('Max retries reached. Could not connect to MongoDB', {
            error: error.message,
            stack: error.stack
        });
        
        // In production, we might want to keep the service running and try to reconnect
        if (process.env.NODE_ENV === 'production') {
            // Schedule a reconnection attempt
            setTimeout(() => connectDB(0), RETRY_DELAY);
            return mongoose;
        }
        
        // In development, fail fast
        process.exit(1);
    }
};

/**
 * Gracefully close the MongoDB connection
 * @returns {Promise<void>}
 */
const closeDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) { // 0 = disconnected
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        }
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        throw error;
    }
};

/**
 * Check if the database connection is healthy
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
    if (!isConnected) return false;
    
    try {
        // A simple query to check if the database is responsive
        await mongoose.connection.db.admin().ping();
        return true;
    } catch (error) {
        logger.error('Database health check failed:', error);
        return false;
    }
};

// Handle application termination
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    closeDB,
    checkHealth,
    isConnected: () => isConnected,
    mongoose // Export mongoose for direct access if needed
};

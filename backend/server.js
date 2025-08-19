require('dotenv').config();

// Validate environment variables before starting
const { validateEnvironment, getEnvironmentSummary } = require('./utils/envValidator');
try {
    validateEnvironment();
} catch (error) {
    console.error('Environment validation failed:', error.message);
    process.exit(1);
}

const express = require('express');
const colors = require('colors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');

// Configure colors
colors.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    success: 'green',
    shutdown: ['white', 'bgRed'],
    step: ['black', 'bgCyan'],
    timestamp: 'gray'
});

const log = {
    info: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp.gray} : [${'INFO'.cyan}] : ${message}`);
    },
    warn: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp.gray} : [${'WARN'.yellow}] : ${message}`);
    },
    error: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp.gray} : [${'ERROR'.red}] : ${message}`);
    },
    success: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp.gray} : [${'SUCCESS'.green}] : ${message}`);
    }
};

// Create Express app
const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',  // For OAuth callbacks
        'http://127.0.0.1:5000'   // For OAuth callbacks
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false,
    maxAge: 600 // 10 minutes
};

// Configure Socket.IO with CORS and other options
const io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
    serveClient: true,
    connectTimeout: 10000,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    maxHttpBufferSize: 1e8 // 100MB max payload size
});

// Handle connection errors
io.engine.on('connection_error', (err) => {
    log.error(`Socket.IO connection error: ${err.message}`);
    log.error(`Error details: ${err.description}`);
    log.error(`Error context: ${JSON.stringify(err.context)}`);
});

// Basic middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more lenient for development
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // increased from 100 to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for deployment worker and AI service
        return req.ip === '127.0.0.1' || req.ip === '::1' || req.headers['user-agent']?.includes('axios');
    }
});
app.use(apiLimiter);

// Request ID middleware
app.use((req, res, next) => {
    req.id = uuidv4();
    res.locals.requestId = req.id;
    next();
});

// API response helpers will be added after import

// Set Content Security Policy headers
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' ws: wss: http: https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests;"
    );
    next();
});

// Import API response helpers
const { addResponseHelpers } = require('./utils/apiResponse');

// Add API response helpers middleware
app.use(addResponseHelpers);

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Swagger documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shard Platform API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
    }
}));

const authRoutes = require('./routes/auth');
const deployRoutes = require('./routes/deploy');
const projectRoutes = require('./routes/project');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const envRoutes = require('./routes/env');
const logsRoutes = require('./routes/logs');
const githubRoutes = require('./routes/github');
const notificationRoutes = require('./routes/notifications');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/projects', projectRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/deployments', deployRoutes); // Also mount at /api/deployments for frontend compatibility
app.use('/api/admin', adminRoutes);
// Mount environment routes
app.use('/api/projects/:projectId/env', envRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/health', healthRoutes);

// Serve static files from the public directory
app.use(express.static('public', {
    setHeaders: (res, path) => {
        // Set cache control headers for HTML files
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Set app locals
app.locals.io = io;
app.locals.log = log;

// Helper function to broadcast deployment logs to subscribed clients
const broadcastDeploymentLog = (deploymentId, logEntry) => {
    io.to(`deployment-${deploymentId}`).emit('deployment-log', logEntry);
};

// Health dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'health.html'));
});

// Realtime health metrics
const getHealthMetrics = async () => {
    const memUsage = process.memoryUsage();

    // Base health data (preserving original structure)
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: {
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
            cpuCount: require('os').cpus().length
        },
        database: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host || 'unknown',
            name: mongoose.connection.name || 'unknown',
            collections: [],
            driver: {
                name: 'MongoDB',
                version: mongoose.version
            }
        },
        server: {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        }
    };

    // Add database collections if connected
    if (mongoose.connection.readyState === 1) {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            healthData.database.collections = collections.map(coll => coll.name);
        } catch (error) {
            console.error('Error fetching collections:', error);
            healthData.database.collectionsError = 'Failed to fetch collections';
        }
    }

    // Add services health check (new addition)
    try {
        const axios = require('axios');
        const services = {};

        // Check deployment worker
        try {
            const workerStart = Date.now();
            const workerResponse = await axios.get('http://localhost:9000/health', { timeout: 2000 });
            const workerResponseTime = Date.now() - workerStart;
            services['deployment-worker'] = {
                status: 'ok',
                responseTime: workerResponseTime,
                details: workerResponse.data
            };
        } catch (error) {
            services['deployment-worker'] = {
                status: 'error',
                error: 'Service unavailable'
            };
        }

        // Check AI review service
        try {
            const aiStart = Date.now();
            const aiResponse = await axios.get('http://localhost:8000/health', { timeout: 2000 });
            const aiResponseTime = Date.now() - aiStart;
            services['ai-review'] = {
                status: 'ok',
                responseTime: aiResponseTime,
                details: aiResponse.data
            };
        } catch (error) {
            services['ai-review'] = {
                status: 'error',
                error: 'Service unavailable'
            };
        }

        healthData.services = services;
    } catch (error) {
        // Fallback if axios is not available
        healthData.services = {
            'deployment-worker': { status: 'error', error: 'Health check failed' },
            'ai-review': { status: 'error', error: 'Health check failed' }
        };
    }

    return healthData;
};

// Health metrics are now handled by the dedicated health route

// Socket.IO connection for realtime health updates and deployment logs
io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    const clientId = socket.id;

    log.info(`Client connected: ${clientId} from ${clientIp}`);
    log.info(`Client transport: ${socket.conn.transport.name}`);

    // Log transport upgrade
    socket.conn.on('upgrade', () => {
        log.info(`Client ${clientId} upgraded to: ${socket.conn.transport.name}`);
    });

    // Handle transport errors
    socket.conn.on('error', (error) => {
        log.error(`Transport error for client ${clientId}:`, error);
    });

    // HEALTH MONITORING FUNCTIONALITY
    let healthInterval = null;

    // Send initial health data
    const sendHealthData = async () => {
        try {
            const healthData = await getHealthMetrics();
            socket.emit('health-data', healthData);
        } catch (error) {
            log.error(`Error sending health data to client ${clientId}:`, error);
            const errorData = {
                status: 'error',
                error: 'Failed to get health data',
                timestamp: new Date().toISOString(),
                services: {
                    'deployment-worker': {
                        status: 'error',
                        error: 'Health check failed',
                        details: error.message
                    },
                    'ai-review': {
                        status: 'error',
                        error: 'Health check failed',
                        details: error.message
                    }
                }
            };
            socket.emit('health-data', errorData);
        }
    };

    // Handle health monitoring subscription
    socket.on('subscribe-health', () => {
        log.info(`Client ${clientId} subscribed to health updates`);
        sendHealthData();
        healthInterval = setInterval(sendHealthData, 5000);
    });

    // Handle health monitoring unsubscription
    socket.on('unsubscribe-health', () => {
        log.info(`Client ${clientId} unsubscribed from health updates`);
        if (healthInterval) {
            clearInterval(healthInterval);
            healthInterval = null;
        }
    });

    // Handle client requesting health data
    socket.on('request-health', sendHealthData);

    // DEPLOYMENT LOGS FUNCTIONALITY
    // Handle deployment log subscription
    socket.on('subscribe-deployment-logs', (deploymentId) => {
        log.info(`Client ${clientId} subscribed to deployment logs for: ${deploymentId}`);
        socket.join(`deployment-${deploymentId}`);
    });

    // Handle deployment log unsubscription
    socket.on('unsubscribe-deployment-logs', (deploymentId) => {
        log.info(`Client ${clientId} unsubscribed from deployment logs for: ${deploymentId}`);
        socket.leave(`deployment-${deploymentId}`);
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        log.info(`Client disconnected: ${socket.id}`);
        if (healthInterval) {
            clearInterval(healthInterval);
        }
    });
});

// Check service health
const checkService = async (name, url) => {
    try {
        const start = Date.now();
        const response = await axios.get(url, { timeout: 2000 });
        const responseTime = Date.now() - start;

        log.success(`${name} service is up (${responseTime}ms)`);
        return {
            status: 'ok',
            responseTime,
            details: response.data
        };
    } catch (error) {
        log.error(`${name} service check failed: ${error.message}`);
        return {
            status: 'error',
            error: error.message
        };
    }
};

// Database connection with retry logic
const connectWithRetry = async (maxRetries = 3, retryDelay = 3000) => {
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            log.info(`Connecting to MongoDB (attempt ${retryCount + 1}/${maxRetries})...`);

            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
            });

            log.success('MongoDB connected successfully');

            // Check other services after successful DB connection
            log.info('Checking dependent services...');

            // Check deployment worker
            const deploymentWorkerUrl = process.env.DEPLOYMENT_WORKER_URL || 'http://localhost:9000';
            const deploymentWorkerCheck = await checkService(
                'Deployment Worker',
                deploymentWorkerUrl.endsWith('/health') ? deploymentWorkerUrl : `${deploymentWorkerUrl}/`
            );

            // Check AI service
            const aiServiceCheck = await checkService(
                'AI Service',
                process.env.AI_SERVICE_URL || 'http://localhost:8000/health'
            );

            return true;
        } catch (error) {
            retryCount++;
            log.error(`MongoDB connection failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);

            if (retryCount < maxRetries) {
                log.info(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                log.error('Max retries reached. Could not connect to MongoDB.');
                return false;
            }
        }
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log('\n' + '═'.repeat(80).yellow.bold);
    console.log(
        `${new Date().toISOString()} : `.black.bold +
        `[${signal}]`.bgYellow.black.bold +
        ` : received — initiating graceful shutdown`.yellow
    );
    console.log('─'.repeat(80).yellow.bold + '\n');

    try {
        // Close HTTP server
        httpServer.close(() => {
            log.success('HTTP server closed');
        });

        // Close database connection if connected
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            log.success('MongoDB connection closed');
        }

        // Give connections a chance to close gracefully
        setTimeout(() => {
            log.success('All connections closed');
            console.log('\n' + '='.repeat(80).green);
            console.log(' Shutdown complete. Goodbye! '.cyan);
            console.log('='.repeat(80).green + '\n');
            process.exit(0);
        }, 1000);

        // Force exit after timeout
        setTimeout(() => {
            log.error('Could not close connections in time, forcing shutdown');
            process.exit(1);
        }, 10000).unref();

    } catch (error) {
        log.error(`Error during shutdown: ${error.message}`);
        process.exit(1);
    }
};

// Handle shutdown signals
const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
shutdownSignals.forEach(signal => {
    process.on(signal, () => gracefulShutdown(signal));
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log.error(`Unhandled Rejection: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error(`Uncaught Exception: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Start the server
const startServer = async () => {
    try {
        // Configure server settings
        const PORT = process.env.PORT || 5000;

        // Connect to database
        log.info('Connecting to database...');
        const dbConnected = await connectWithRetry();
        if (!dbConnected) {
            log.warn('Starting server in degraded mode without database connection');
        }

        // Initialize Socket.IO server
        log.info('Initializing WebSocket server...');
        io.engine.on('initial_headers', (headers, req) => {
            headers['X-Health-Dashboard'] = 'true';
        });

        // Start HTTP server
        log.info(`Starting HTTP server on port ${PORT}...`);
        await new Promise((resolve) => {
            httpServer.listen(PORT, '0.0.0.0', resolve);
        });

        // Server is now listening
        const message = `Server started on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`;
        log.success(message);

        // Log server information
        const line = '='.repeat(80);
        const title = 'Shard Platform Backend'.bold;
        const padding = Math.floor((line.length - title.length) / 2);

        // Log WebSocket server status
        log.info('WebSocket server status:', {
            path: io.path(),
            connectedClients: io.engine.clientsCount,
            pingInterval: io.engine.pingInterval,
            pingTimeout: io.engine.pingTimeout
        });

        // Log health dashboard URL
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.HOST || 'localhost';
        log.success(`Health Dashboard: ${protocol}://${host}:${PORT}/health.html`);

        console.log(`\n${line}`.green);
        console.log(`${' '.repeat(padding)}${title}`.white);
        console.log(`${line}\n`.green);
        console.log(`${message}`.green);
        console.log(`Health Check: http://localhost:${PORT}/health`.blue);
        console.log(`Dashboard: http://localhost:${PORT}/dashboard\n`.magenta);

        return { httpServer, io };
    }

    catch (error) {
        log.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = { app, httpServer };

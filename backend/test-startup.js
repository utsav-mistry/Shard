// Simple startup test
console.log('Testing server startup...');

try {
    // Test environment validation
    const { validateEnvironment } = require('./utils/envValidator');
    validateEnvironment();
    console.log('Environment validation: PASSED');

    // Test API response helpers
    const { addResponseHelpers } = require('./utils/apiResponse');
    console.log('API response helpers: LOADED');

    // Test route imports
    const authRoutes = require('./routes/auth');
    const projectRoutes = require('./routes/project');
    const deployRoutes = require('./routes/deploy');
    const healthRoutes = require('./routes/health');
    const adminRoutes = require('./routes/admin');
    const envRoutes = require('./routes/env');
    const logsRoutes = require('./routes/logs');
    console.log('All routes: LOADED');

    console.log('Server startup test: PASSED');
    console.log('All components are properly configured and ready for development.');

} catch (error) {
    console.error('Server startup test: FAILED');
    console.error('Error:', error.message);
    process.exit(1);
}
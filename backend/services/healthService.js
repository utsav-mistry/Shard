const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Health Service
 * Provides aggregated health status for all dependent services
 */

const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Check health of a single service
 */
async function checkServiceHealth(serviceName, url, timeout = DEFAULT_TIMEOUT) {
    const startTime = Date.now();

    try {
        const response = await axios.get(url, {
            timeout,
            validateStatus: (status) => status < 500 // Accept any status < 500 as "up"
        });

        const responseTime = Date.now() - startTime;

        return {
            status: 'ok',
            responseTime,
            timestamp: new Date().toISOString(),
            details: response.data || { message: 'Service is responding' }
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        logger.warn(`Health check failed for ${serviceName}`, {
            service: serviceName,
            url,
            error: error.message,
            responseTime
        });

        return {
            status: 'error',
            responseTime,
            timestamp: new Date().toISOString(),
            error: error.code === 'ECONNREFUSED' ? 'Service unavailable' : error.message
        };
    }
}

/**
 * Get aggregated health status of all services
 */
async function getAggregatedHealth() {
    const services = {};
    let overallStatus = 'ok';

    // Define services to check
    const servicesToCheck = [
        {
            name: 'deployment-worker',
            url: process.env.DEPLOYMENT_WORKER_URL
                ? `${process.env.DEPLOYMENT_WORKER_URL}/health`
                : 'http://localhost:9000/health'
        },
        {
            name: 'ai-review',
            url: process.env.AI_SERVICE_URL
                ? `${process.env.AI_SERVICE_URL}/health`
                : 'http://localhost:8000/health'
        }
    ];

    // Check all services in parallel
    const healthChecks = servicesToCheck.map(async (service) => {
        const health = await checkServiceHealth(service.name, service.url);
        services[service.name] = health;

        // If any service is down, mark overall status as degraded
        if (health.status !== 'ok') {
            overallStatus = 'degraded';
        }

        return { name: service.name, health };
    });

    try {
        await Promise.all(healthChecks);
    } catch (error) {
        logger.error('Error during health checks', { error: error.message });
        overallStatus = 'error';
    }

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services
    };
}

/**
 * Get detailed system health including services
 */
async function getSystemHealth() {
    const servicesHealth = await getAggregatedHealth();

    return {
        status: servicesHealth.status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: servicesHealth.services
    };
}

/**
 * Check if a specific service is healthy
 */
async function isServiceHealthy(serviceName) {
    const health = await getAggregatedHealth();
    const service = health.services[serviceName];
    return service && service.status === 'ok';
}

module.exports = {
    checkServiceHealth,
    getAggregatedHealth,
    getSystemHealth,
    isServiceHealthy
};
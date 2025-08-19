/**
 * @fileoverview Health Service
 * @description Provides aggregated health status monitoring for all dependent services
 * @module services/healthService
 * @requires axios
 * @requires ../utils/logger
 * @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require('axios');
const logger = require('../utils/logger');

const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Checks health of a single service
 * @async
 * @function checkServiceHealth
 * @param {string} serviceName - Name of the service being checked
 * @param {string} url - Health check endpoint URL
 * @param {number} [timeout=5000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Health status with response time and details
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
 * Gets aggregated health status of all services
 * @async
 * @function getAggregatedHealth
 * @returns {Promise<Object>} Overall health status with individual service details
 * @example
 * const health = await getAggregatedHealth();
 * console.log(health.status); // 'ok', 'degraded', or 'error'
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
 * Gets detailed system health including services and system metrics
 * @async
 * @function getSystemHealth
 * @returns {Promise<Object>} Complete system health with uptime and memory usage
 * @example
 * const systemHealth = await getSystemHealth();
 * console.log(systemHealth.uptime); // Process uptime in seconds
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
 * Checks if a specific service is healthy
 * @async
 * @function isServiceHealthy
 * @param {string} serviceName - Name of the service to check
 * @returns {Promise<boolean>} True if service is healthy, false otherwise
 * @example
 * const isHealthy = await isServiceHealthy('deployment-worker');
 */
async function isServiceHealthy(serviceName) {
    const health = await getAggregatedHealth();
    const service = health.services[serviceName];
    return service && service.status === 'ok';
}

/**
 * @namespace healthService
 * @description Service health monitoring and aggregation utilities
 */
module.exports = {
    checkServiceHealth,
    getAggregatedHealth,
    getSystemHealth,
    isServiceHealthy
};
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware to ensure idempotency of non-GET requests
 * Uses an idempotency key header to prevent duplicate operations
 * 
 * @param {Object} cache - Cache service instance
 * @param {number} [ttl=86400] - Time to keep idempotency keys in cache (default: 24 hours)
 * @returns {Function} Express middleware function
 */
const idempotencyMiddleware = (cache, ttl = 86400) => {
    return async (req, res, next) => {
        // Skip for GET requests as they should be idempotent by design
        if (req.method === 'GET') {
            return next();
        }

        // Get idempotency key from header
        const idempotencyKey = req.headers['idempotency-key'];
        
        // If no key provided, continue without idempotency check
        if (!idempotencyKey) {
            return next();
        }

        // Create a hash of the request to identify duplicate requests
        const requestHash = createRequestHash(req, idempotencyKey);
        const cacheKey = `idempotency:${requestHash}`;

        try {
            // Check if we've seen this request before
            const cachedResponse = await cache.get(cacheKey);
            
            if (cachedResponse) {
                logger.info('Idempotent request detected, returning cached response', {
                    method: req.method,
                    url: req.originalUrl,
                    idempotencyKey,
                    cacheKey
                });
                
                // Return the cached response
                return res
                    .status(cachedResponse.status)
                    .set(cachedResponse.headers)
                    .send(cachedResponse.body);
            }

            // Store the original response methods
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;
            
            // Response data collector
            const responseChunks = [];
            
            // Override response methods to capture the response
            res.send = function (body) {
                responseChunks.push(body);
                originalSend.apply(res, arguments);
            };
            
            res.json = function (body) {
                responseChunks.push(JSON.stringify(body));
                originalJson.apply(res, arguments);
            };
            
            res.end = function (chunk, encoding) {
                if (chunk) {
                    responseChunks.push(chunk);
                }
                
                // Only cache successful responses (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const responseBody = responseChunks.join('');
                    const responseToCache = {
                        status: res.statusCode,
                        headers: res.getHeaders(),
                        body: responseBody
                    };
                    
                    // Cache the response
                    cache.set(cacheKey, responseToCache, ttl)
                        .then(() => {
                            logger.debug('Cached idempotent response', {
                                method: req.method,
                                url: req.originalUrl,
                                status: res.statusCode,
                                idempotencyKey,
                                cacheKey
                            });
                        })
                        .catch(error => {
                            logger.error('Failed to cache idempotent response', {
                                error: error.message,
                                method: req.method,
                                url: req.originalUrl,
                                idempotencyKey,
                                cacheKey
                            });
                        });
                }
                
                originalEnd.apply(res, [chunk, encoding]);
            };
            
            next();
        } catch (error) {
            logger.error('Idempotency middleware error', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                url: req.originalUrl,
                idempotencyKey
            });
            next(); // Continue to next middleware even if idempotency check fails
        }
    };
};

/**
 * Create a hash of the request to identify duplicate requests
 * @private
 */
function createRequestHash(req, idempotencyKey) {
    const requestData = {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query,
        idempotencyKey
    };
    
    // Create a hash of the request data
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(requestData))
        .digest('hex');
}

module.exports = idempotencyMiddleware;

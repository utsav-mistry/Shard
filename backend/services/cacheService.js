const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Cache service using NodeCache (LRU cache implementation)
 * Configurable TTL and max items
 */
class CacheService {
    constructor(ttlSeconds = 600, maxKeys = 1000) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2, // Check for expired items every 20% of TTL
            maxKeys: maxKeys,
            useClones: false, // Better performance as we don't need to clone objects
            deleteOnExpire: true, // Automatically remove expired items
            enableLegacyCallbacks: false, // Use promises instead of callbacks
        });

        // Log cache statistics periodically
        if (process.env.NODE_ENV !== 'test') {
            this.logStats();
        }
    }

    /**
     * Get value by key
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        try {
            const value = this.cache.get(key);
            if (value === undefined) {
                logger.debug(`Cache miss for key: ${key}`);
            } else {
                logger.debug(`Cache hit for key: ${key}`);
            }
            return value;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value with key and optional TTL
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl] - Time to live in seconds (overrides default if provided)
     * @returns {boolean}
     */
    set(key, value, ttl) {
        try {
            const success = ttl 
                ? this.cache.set(key, value, ttl)
                : this.cache.set(key, value);
            
            if (success) {
                logger.debug(`Cache set for key: ${key}${ttl ? ` with TTL: ${ttl}s` : ''}`);
            } else {
                logger.warn(`Failed to set cache for key: ${key}`);
            }
            return success;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value by key
     * @param {string} key
     * @returns {number} Number of deleted keys
     */
    del(key) {
        try {
            const deleted = this.cache.del(key);
            if (deleted > 0) {
                logger.debug(`Cache deleted for key: ${key}`);
            }
            return deleted;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return 0;
        }
    }

    /**
     * Clear the entire cache
     * @returns {Promise<void>}
     */
    async flush() {
        try {
            this.cache.flushAll();
            logger.info('Cache flushed');
        } catch (error) {
            logger.error('Cache flush error:', error);
            throw error;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            keyCount: this.cache.getStats().keys,
            ksize: this.cache.getStats().ksize,
            vsize: this.cache.getStats().vsize
        };
    }

    /**
     * Log cache statistics periodically
     * @private
     */
    logStats() {
        const stats = this.getStats();
        logger.info('Cache Statistics:', {
            ...stats,
            hitRate: stats.hits / (stats.hits + stats.misses) || 0
        });

        // Log stats every 5 minutes
        this.statsInterval = setInterval(() => {
            const currentStats = this.getStats();
            logger.debug('Cache Statistics:', {
                ...currentStats,
                hitRate: currentStats.hits / (currentStats.hits + currentStats.misses) || 0
            });
        }, 5 * 60 * 1000);
    }

    /**
     * Clean up resources
     */
    close() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        this.cache.close();
    }
}

// Export a singleton instance
module.exports = new CacheService(
    parseInt(process.env.CACHE_TTL || '600', 10),
    parseInt(process.env.CACHE_MAX_KEYS || '1000', 10)
);

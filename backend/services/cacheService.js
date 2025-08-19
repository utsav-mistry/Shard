/**
 * @fileoverview Cache Service
 * @description In-memory caching service using NodeCache with TTL and statistics
 * @module services/cacheService
 * @requires node-cache
 * @requires ../utils/logger
 * @author Utsav Mistry
 * @version 1.0.0
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Cache service using NodeCache (LRU cache implementation)
 * @class CacheService
 * @classdesc Provides in-memory caching with configurable TTL and max items
 * @param {number} [ttlSeconds=600] - Default time-to-live in seconds
 * @param {number} [maxKeys=1000] - Maximum number of keys to store
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
     * Gets value by key from cache
     * @method get
     * @param {string} key - Cache key to retrieve
     * @returns {*} Cached value or undefined if not found
     * @example
     * const userData = cache.get('user:123');
     * if (userData) {
     *   console.log('Found in cache:', userData);
     * }
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
     * Sets value with key and optional TTL
     * @method set
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} [ttl] - Time to live in seconds (overrides default if provided)
     * @returns {boolean} True if successfully set, false otherwise
     * @example
     * // Set with default TTL
     * cache.set('user:123', userData);
     * 
     * // Set with custom TTL (5 minutes)
     * cache.set('temp:data', tempData, 300);
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
     * Deletes value by key from cache
     * @method del
     * @param {string} key - Cache key to delete
     * @returns {number} Number of deleted keys (0 or 1)
     * @example
     * const deleted = cache.del('user:123');
     * console.log(`Deleted ${deleted} items`);
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
     * Clears the entire cache
     * @async
     * @method flush
     * @returns {Promise<void>}
     * @throws {Error} If cache flush operation fails
     * @example
     * await cache.flush();
     * console.log('Cache cleared');
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
     * Gets cache statistics
     * @method getStats
     * @returns {Object} Cache statistics object
     * @property {number} keys - Number of keys in cache
     * @property {number} hits - Number of cache hits
     * @property {number} misses - Number of cache misses
     * @property {number} keyCount - Total key count
     * @property {number} ksize - Size of keys in bytes
     * @property {number} vsize - Size of values in bytes
     * @example
     * const stats = cache.getStats();
     * console.log(`Hit rate: ${stats.hits / (stats.hits + stats.misses)}`);
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
     * Logs cache statistics periodically (every 5 minutes)
     * @private
     * @method logStats
     * @returns {void}
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
     * Cleans up resources and stops periodic logging
     * @method close
     * @returns {void}
     * @example
     * // Clean up when shutting down
     * cache.close();
     */
    close() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        this.cache.close();
    }
}

/**
 * Singleton cache service instance
 * @type {CacheService}
 * @description Pre-configured cache instance with environment-based settings
 */
const cacheInstance = new CacheService(
    parseInt(process.env.CACHE_TTL || '600', 10),
    parseInt(process.env.CACHE_MAX_KEYS || '1000', 10)
);

/**
 * @namespace cacheService
 * @description In-memory caching service with TTL and statistics
 */
module.exports = cacheInstance;
module.exports.CacheService = CacheService;

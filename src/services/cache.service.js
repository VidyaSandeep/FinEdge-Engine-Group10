import logger from '../utils/logger.js';

/**
 * in-memory cache service with TTL.
 */
class CacheService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * cache with a specific TTL.
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds Default is 300 seconds (5 minutes)
     */
    set(key, value, ttlSeconds = 300) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiresAt });
        logger.debug({ key, ttlSeconds }, 'Cache set');
    }


    // Get value of key if not expired.
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            logger.debug({ key }, 'Cache expired');
            return null;
        }

        logger.debug({ key }, 'Cache hit');
        return item.value;
    }

    delete(key) {
        this.cache.delete(key);
    }


    clear() {
        this.cache.clear();
    }
}

// Export as a singleton
export default new CacheService();

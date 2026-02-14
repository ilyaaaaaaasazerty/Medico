import Redis from 'ioredis';
import { logger } from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
    retryStrategy(times) {
        if (times > 3) {
            return null; // Stop retrying after 3 attempts if server is down (prevents infinite spam)
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
    // Only log distinct errors or critical ones, silence connection refused loops in dev
    if (redis.status === 'reconnecting') return;
    logger.warn('Redis connection issue', { error: err.message });
});

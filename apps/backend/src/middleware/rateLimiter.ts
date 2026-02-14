import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import { redis } from '../lib/redis.js';

// General API Limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    // Default to MemoryStore for now since Redis is missing
    /* store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
        prefix: 'rl:api:',
    }), */
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
});

// Strict Auth Limiter: 5 failed attempts per hour
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    // Default to MemoryStore
    /* store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
        prefix: 'rl:auth:',
    }), */
    message: {
        success: false,
        error: 'Too many login attempts, please try again later.',
    },
});

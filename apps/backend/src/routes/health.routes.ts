import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Liveness Probe (Is the server running?)
router.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness Probe (Are dependencies healthy?)
router.get('/health/ready', async (_req, res) => {
    try {
        // Check Database
        await prisma.$queryRaw`SELECT 1`;

        // Check Redis
        const redisStatus = redis.status === 'ready' ? 'ok' : 'down';
        if (redisStatus === 'down') {
            throw new Error('Redis is down');
        }

        res.status(200).json({
            status: 'ok',
            services: {
                database: 'up',
                redis: 'up'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(503).json({
            status: 'error',
            error: error.message,
            services: {
                database: 'unknown',
                redis: redis.status
            },
            timestamp: new Date().toISOString()
        });
    }
});

export default router;

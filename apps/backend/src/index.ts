console.log('BCRYPT_ROUNDS:', process.env.BCRYPT_ROUNDS);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import v1Router from './routes/v1.js';
import healthRouter from './routes/health.routes.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { getMetrics } from './lib/metrics.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: [config.FRONTEND_URL, config.MOBILE_URL].filter(Boolean),
        credentials: true,
    })
);

// Redis-backed Rate Limiting
app.use(apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Prometheus Metrics Middleware (Measure latency)
app.use(metricsMiddleware);

// Health Checks (Top level)
app.use(healthRouter);

// Metrics Endpoint (Internal/Admin)
app.get('/metrics', getMetrics);

// API Versioning
app.use('/api/v1', v1Router);
app.use('/uploads', express.static('uploads'));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${config.NODE_ENV}`);
    console.log(`📚 API Base: ${config.BACKEND_URL}/api/v1`);
});

export default app;

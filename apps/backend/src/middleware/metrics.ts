import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationMicroseconds } from '../lib/metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const end = httpRequestDurationMicroseconds.startTimer();

    res.on('finish', () => {
        const route = req.route ? req.route.path : req.path;
        end({
            method: req.method,
            route: route,
            code: res.statusCode
        });
    });

    next();
};

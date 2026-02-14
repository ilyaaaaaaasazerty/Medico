import CircuitBreaker from 'opossum';
import { logger } from './logger.js';

// Generic Circuit Breaker Wrapper
export const createBreaker = <TArgs extends any[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
    name: string,
    options: CircuitBreaker.Options = {}
): CircuitBreaker<TArgs, TResult> => {
    const breaker = new CircuitBreaker(action, {
        timeout: 3000, // 3 seconds timeout
        errorThresholdPercentage: 50, // Open breaker if 50% of requests fail
        resetTimeout: 10000, // Try again after 10 seconds
        ...options
    });

    breaker.fallback(() => {
        logger.warn(`[CircuitBreaker] Fallback triggered for ${name}`);
        return { success: false, error: 'Service temporarily unavailable' } as any;
    });

    breaker.on('open', () => logger.warn(`[CircuitBreaker] OPEN: ${name}`));
    breaker.on('halfOpen', () => logger.info(`[CircuitBreaker] HALF-OPEN: ${name}`));
    breaker.on('close', () => logger.info(`[CircuitBreaker] CLOSED: ${name}`));

    return breaker;
};

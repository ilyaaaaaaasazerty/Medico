import { Queue, Worker, QueueOptions } from 'bullmq';
import { redis } from './redis.js';
import { logger } from './logger.js';

export const createQueue = (name: string, options?: QueueOptions) => {
    return new Queue(name, {
        connection: redis,
        ...options,
    });
};

export const createWorker = (name: string, processor: any) => {
    const worker = new Worker(name, processor, {
        connection: redis,
    });

    worker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed in queue ${name}`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed in queue ${name}`, { error: err.message });
    });

    return worker;
};

// Define Standard Queues
export const emailQueue = createQueue('email-queue');
export const notificationQueue = createQueue('notification-queue');
export const fileProcessingQueue = createQueue('file-processing-queue');

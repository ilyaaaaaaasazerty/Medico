import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Zod Validation Errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        message = 'Validation Error';
        console.error('[ZodError] Details:', err.message);
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                details: err.message
            },
        });
    }

    // Log extra details for S3/AWS errors if available
    if ((err as any).$response) {
        console.error('[AWS Raw Response Body]:', (err as any).$response.body);
        console.error('[AWS Metadata]:', (err as any).$metadata);
    }

    return res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

export class ApiError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error factory functions
export const BadRequest = (message: string) => {
    const error = new Error(message) as AppError;
    error.statusCode = 400;
    error.isOperational = true;
    return error;
};
export const Unauthorized = (message: string) => {
    const error = new Error(message) as AppError;
    error.statusCode = 401;
    error.isOperational = true;
    return error;
};
export const Forbidden = (message: string) => {
    const error = new Error(message) as AppError;
    error.statusCode = 403;
    error.isOperational = true;
    return error;
};
export const NotFound = (message: string) => {
    const error = new Error(message) as AppError;
    error.statusCode = 404;
    error.isOperational = true;
    return error;
};
export const Conflict = (message: string) => new ApiError(409, message);
export const InternalError = (message = 'Internal server error') =>
    new ApiError(500, message, false);

// Async handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as any, res, next)).catch(next);

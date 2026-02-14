import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import prisma from '../lib/prisma.js';
import { Unauthorized, Forbidden } from './errorHandler.js';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
    };
}

interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}

export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        let token: string | undefined;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token as string;
        }

        console.log('[Auth] Header:', authHeader ? 'Present' : 'Missing');
        console.log('[Auth] Token:', token ? token.substring(0, 10) + '...' : 'Missing');

        if (!token) {
            throw Unauthorized('No token provided');
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, status: true },
        });

        if (!user) {
            throw Unauthorized('User not found');
        }

        if (user.status === 'SUSPENDED') {
            throw Forbidden('Account is suspended');
        }

        if (user.status === 'DELETED') {
            throw Unauthorized('Account has been deleted');
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error: any) {
        console.error('[Auth Error]:', error.message);
        if (error instanceof jwt.JsonWebTokenError) {
            next(Unauthorized('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(Unauthorized('Token expired'));
        } else {
            next(error);
        }
    }
};

export const authorize = (...roles: Role[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(Unauthorized('Not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            return next(Forbidden('Insufficient permissions'));
        }

        next();
    };
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, status: true },
        });

        if (user && user.status === 'ACTIVE') {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };
        }

        next();
    } catch {
        // Token invalid, continue as unauthenticated
        next();
    }
};

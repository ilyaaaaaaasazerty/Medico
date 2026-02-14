import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { Forbidden } from './errorHandler.js';

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || user.role !== Role.SUPER_ADMIN) {
        return next(Forbidden('Access denied. Super Admin privileges required.'));
    }

    next();
};

export const requireStaff = (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.STAFF)) {
        return next(Forbidden('Access denied. Staff privileges required.'));
    }

    next();
};

import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /specialties - List all specialties
router.get('/', async (_req, res, next) => {
    try {
        const specialties = await prisma.specialty.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: specialties,
        });
    } catch (error) {
        next(error);
    }
});

// GET /specialties/:id - Get specialty by ID
router.get('/:id', async (req, res, next) => {
    try {
        const specialty = await prisma.specialty.findUnique({
            where: { id: req.params.id },
            include: {
                doctors: {
                    include: {
                        doctor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                                verificationStatus: true,
                            },
                        },
                    },
                },
                services: true,
            },
        });

        if (!specialty) {
            return res.status(404).json({
                success: false,
                error: { message: 'Specialty not found' },
            });
        }

        return res.json({
            success: true,
            data: specialty,
        });
    } catch (error) {
        return next(error);
    }
});

export default router;

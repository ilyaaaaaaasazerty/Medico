import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /services - List all services
// GET /services - List all services or filter by doctor
router.get('/', async (req, res, next) => {
    try {
        const { doctorId } = req.query;
        let where: any = { isActive: true };

        if (doctorId && typeof doctorId === 'string') {
            // Get doctor's specialties
            const doctorSpecialties = await prisma.doctorSpecialty.findMany({
                where: { doctorId },
                select: { specialtyId: true },
            });

            const specialtyIds = doctorSpecialties.map(ds => ds.specialtyId);

            // Filter services that belong to doctor's specialties OR have no specialty (general)
            where = {
                ...where,
                OR: [
                    { specialtyId: { in: specialtyIds } },
                    { specialtyId: null } // Optional: include general services valid for all
                ]
            };
        }

        const services = await prisma.service.findMany({
            where,
            include: {
                specialty: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: services,
        });
    } catch (error) {
        next(error);
    }
});

// GET /services/:id - Get service by ID
router.get('/:id', async (req, res, next) => {
    try {
        const service = await prisma.service.findUnique({
            where: { id: req.params.id },
            include: {
                specialty: true,
            },
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                error: { message: 'Service not found' },
            });
        }

        return res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        return next(error);
    }
});

export default router;

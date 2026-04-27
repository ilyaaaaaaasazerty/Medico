import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import * as transportService from '../services/transport.service.js';
import { prisma } from '../lib/prisma.js';
import { TransportProviderStatus, TransportReqStatus } from '@prisma/client';

const router = Router();

const createRequestSchema = z.object({
    type: z.enum(['AMBULANCE', 'EMERGENCY', 'NON_EMERGENCY', 'WHEELCHAIR_ACCESSIBLE']),
    pickupAddress: z.string(),
    pickupLat: z.number(),
    pickupLng: z.number(),
    destinationAddress: z.string().optional(),
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    notes: z.string().optional(),
});

// ===========================================
// PATIENT ROUTES
// ===========================================

// POST /transport/requests — Patient requests a transport
router.post('/requests', authenticate, authorize('PATIENT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
            return res.status(404).json({ success: false, error: 'Patient profile not found. Please complete your profile first.' });
        }

        const data = createRequestSchema.parse(req.body);
        const result = await transportService.createTransportRequest({ patientId: patient.id, ...data });
        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'ACTIVE_REQUEST_EXISTS') {
            return res.status(400).json({ success: false, error: 'You already have an active request' });
        }
        return next(error);
    }
});

// GET /transport/requests/active — Patient's active request
router.get('/requests/active', authenticate, authorize('PATIENT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
            return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
        }
        const request = await transportService.getPatientActiveRequest(patient.id);
        return res.json({ success: true, data: request });
    } catch (error) {
        return next(error);
    }
});

// ===========================================
// DRIVER ROUTES
// ===========================================

// GET /transport/driver/me — Driver profile and dashboard
router.get('/driver/me', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const provider = await prisma.transportProvider.findUnique({
            where: { userId },
            include: {
                vehicles: true,
                workingHours: { orderBy: { dayOfWeek: 'asc' } },
                requests: {
                    where: {
                        status: { in: [TransportReqStatus.PENDING, TransportReqStatus.ACCEPTED, TransportReqStatus.ARRIVED_PICKUP, TransportReqStatus.IN_TRANSIT] }
                    },
                    include: { patient: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!provider) return res.status(404).json({ success: false, error: 'Transport provider profile not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStats = await prisma.transportRequest.aggregate({
            where: { providerId: provider.id, completedAt: { gte: today } },
            _count: true,
            _sum: { costs: true }
        });

        return res.json({
            success: true,
            data: {
                profile: provider,
                stats: { completedToday: todayStats._count, earningsToday: todayStats._sum.costs || 0 }
            }
        });
    } catch (error) {
        return next(error);
    }
});

// POST /transport/driver/status — Update driver availability
router.post('/driver/status', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({ status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']) });
        const { status } = schema.parse(req.body);
        const provider = await prisma.transportProvider.update({
            where: { userId: req.user!.id },
            data: { status: status as TransportProviderStatus }
        });
        return res.json({ success: true, data: provider });
    } catch (error) {
        return next(error);
    }
});

// GET /transport/driver/schedule
router.get('/driver/schedule', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const provider = await prisma.transportProvider.findUnique({
            where: { userId: req.user!.id },
            include: { workingHours: { orderBy: { dayOfWeek: 'asc' } } }
        });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
        return res.json({ success: true, data: provider.workingHours });
    } catch (error) {
        return next(error);
    }
});

// POST /transport/driver/schedule
router.post('/driver/schedule', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            schedule: z.array(z.object({
                dayOfWeek: z.number().min(0).max(6),
                openTime: z.string(),
                closeTime: z.string(),
                isClosed: z.boolean().optional()
            }))
        });
        const { schedule } = schema.parse(req.body);
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        for (const day of schedule) {
            await prisma.transportWorkingHours.upsert({
                where: { transportProviderId_dayOfWeek: { transportProviderId: provider.id, dayOfWeek: day.dayOfWeek } },
                update: { openTime: day.openTime, closeTime: day.closeTime, isClosed: day.isClosed ?? false },
                create: { transportProviderId: provider.id, dayOfWeek: day.dayOfWeek, openTime: day.openTime, closeTime: day.closeTime, isClosed: day.isClosed ?? false }
            });
        }
        const updated = await prisma.transportWorkingHours.findMany({
            where: { transportProviderId: provider.id },
            orderBy: { dayOfWeek: 'asc' }
        });
        return res.json({ success: true, data: updated });
    } catch (error) {
        return next(error);
    }
});

// GET /transport/driver/requests — Available pending requests
router.get('/driver/requests', authenticate, authorize('TRANSPORT_PROVIDER'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const requests = await prisma.transportRequest.findMany({
            where: { status: 'PENDING', providerId: null },
            include: { patient: { select: { firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return res.json({ success: true, data: requests });
    } catch (error) {
        return next(error);
    }
});

// GET /transport/driver/requests/active
router.get('/driver/requests/active', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        const activeRequest = await prisma.transportRequest.findFirst({
            where: { providerId: provider.id, status: { in: ['ACCEPTED', 'ARRIVED_PICKUP', 'IN_TRANSIT'] } },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        user: { select: { phone: true } }
                    }
                }
            }
        });
        return res.json({ success: true, data: activeRequest });
    } catch (error) {
        return next(error);
    }
});

// POST /transport/driver/requests/:id/accept
router.post('/driver/requests/:id/accept', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        const request = await prisma.transportRequest.findUnique({ where: { id } });
        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ success: false, error: 'Request no longer available' });
        }

        const updated = await prisma.transportRequest.update({
            where: { id },
            data: { providerId: provider.id, status: 'ACCEPTED', acceptedAt: new Date() },
            include: { patient: true }
        });
        await prisma.transportProvider.update({ where: { id: provider.id }, data: { status: 'BUSY' } });
        return res.json({ success: true, data: updated });
    } catch (error) {
        return next(error);
    }
});

// POST /transport/driver/requests/:id/status
router.post('/driver/requests/:id/status', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const schema = z.object({ status: z.enum(['ARRIVED_PICKUP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']) });
        const { status } = schema.parse(req.body);

        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        const request = await prisma.transportRequest.findUnique({ where: { id } });
        if (!request || request.providerId !== provider.id) {
            return res.status(403).json({ success: false, error: 'Not authorized for this request' });
        }

        const updateData: any = { status: status as TransportReqStatus };
        if (status === 'ARRIVED_PICKUP') updateData.arrivedAt = new Date();
        if (status === 'IN_TRANSIT') updateData.pickedUpAt = new Date();
        if (status === 'COMPLETED') updateData.completedAt = new Date();
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            await prisma.transportProvider.update({ where: { id: provider.id }, data: { status: 'AVAILABLE' } });
        }

        const updated = await prisma.transportRequest.update({ where: { id }, data: updateData, include: { patient: true } });
        return res.json({ success: true, data: updated });
    } catch (error) {
        return next(error);
    }
});

// POST /transport/driver/location — Update real-time GPS location
router.post('/driver/location', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({ lat: z.number(), lng: z.number() });
        const { lat, lng } = schema.parse(req.body);
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        await transportService.updateProviderLocation(provider.id, lat, lng);
        return res.json({ success: true });
    } catch (error) {
        return next(error);
    }
});

// GET /transport/driver/history
router.get('/driver/history', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        const [rides, total] = await Promise.all([
            prisma.transportRequest.findMany({
                where: { providerId: provider.id, status: { in: ['COMPLETED', 'CANCELLED'] } },
                include: { patient: { select: { firstName: true, lastName: true } } },
                orderBy: { completedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.transportRequest.count({ where: { providerId: provider.id, status: { in: ['COMPLETED', 'CANCELLED'] } } })
        ]);

        return res.json({ success: true, data: rides, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        return next(error);
    }
});

export default router;

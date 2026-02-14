import { Router, Request, Response, NextFunction } from 'express';
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

// Patients can request transport
router.post('/requests', authenticate, authorize('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        // Try to find patient record for this user
        let patient = await prisma.patient.findUnique({
            where: { userId }
        });

        // If not found, auto-create a Patient profile if the user is a Doctor or Staff
        if (!patient) {
            const userWithProfile = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true, staff: true, clinicAdmin: true } // Add other profiles as needed
            });

            const profile = userWithProfile?.doctor || userWithProfile?.staff || userWithProfile?.clinicAdmin;
            
            if (profile && 'firstName' in profile && 'lastName' in profile) {
                // Auto-create Patient profile for testing/dual-role usage
                patient = await prisma.patient.create({
                    data: {
                        userId,
                        firstName: profile.firstName || 'Test',
                        lastName: profile.lastName || 'User',
                        dateOfBirth: new Date('1990-01-01'), // Default
                        gender: 'OTHER', // Default
                    }
                });
            } else {
                // Last resort fallback for admins without profiles
                patient = await prisma.patient.create({
                    data: {
                        userId,
                        firstName: 'Admin',
                        lastName: 'User',
                        dateOfBirth: new Date('1990-01-01'),
                        gender: 'OTHER',
                    }
                });
            }
        }

        const data = createRequestSchema.parse(req.body);
        const result = await transportService.createTransportRequest({
            patientId: patient.id,
            ...data
        });

        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'ACTIVE_REQUEST_EXISTS') {
            return res.status(400).json({ success: false, error: 'You already have an active request' });
        }
        next(error);
    }
});

// Get current active request (Patient)
router.get('/requests/active', authenticate, authorize('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        let patient = await prisma.patient.findUnique({ where: { userId } });

        if (!patient) {
             // Fallback: Check if we can create a patient stub for this user (Doctor/Admin testing)
             const userWithProfile = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true, staff: true }
            });
            const profile = userWithProfile?.doctor || userWithProfile?.staff;
            
            if (profile) {
                patient = await prisma.patient.create({
                    data: {
                        userId,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        dateOfBirth: new Date('1990-01-01'),
                        gender: 'OTHER'
                    }
                });
            } else {
                 return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
            }
        }

        const request = await transportService.getPatientActiveRequest(patient.id);
        res.json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
});

// ===========================================
// DRIVER ROUTES
// ===========================================

// GET /transport/driver/me - Driver profile and dashboard
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
                        status: { 
                            in: [
                                TransportReqStatus.PENDING, 
                                TransportReqStatus.ACCEPTED, 
                                TransportReqStatus.ARRIVED_PICKUP, 
                                TransportReqStatus.IN_TRANSIT
                            ] 
                        } 
                    },
                    include: { patient: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!provider) {
            return res.status(404).json({ success: false, error: 'Transport provider profile not found' });
        }

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStats = await prisma.transportRequest.aggregate({
            where: { providerId: provider.id, completedAt: { gte: today } },
            _count: true,
            _sum: { costs: true }
        });

        res.json({
            success: true,
            data: {
                profile: provider,
                stats: { completedToday: todayStats._count, earningsToday: todayStats._sum.costs || 0 }
            }
        });
    } catch (error) {
        console.error('[Transport Dashboard Error]:', error);
        next(error);
    }
});

// POST /transport/driver/status - Update driver status
router.post('/driver/status', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({ status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']) });
        const { status } = schema.parse(req.body);

        const provider = await prisma.transportProvider.update({
            where: { userId: req.user!.id },
            data: { status: status as TransportProviderStatus }
        });

        res.json({ success: true, data: provider });
    } catch (error) {
        next(error);
    }
});

// GET /transport/driver/schedule - Get working hours
router.get('/driver/schedule', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const provider = await prisma.transportProvider.findUnique({
            where: { userId: req.user!.id },
            include: { workingHours: { orderBy: { dayOfWeek: 'asc' } } }
        });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        res.json({ success: true, data: provider.workingHours });
    } catch (error) {
        next(error);
    }
});

// POST /transport/driver/schedule - Update working hours
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
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// GET /transport/driver/requests - Available pending requests
router.get('/driver/requests', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const requests = await prisma.transportRequest.findMany({
            where: { status: 'PENDING', providerId: null },
            include: { patient: { select: { firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
});

// GET /transport/driver/requests/active - Driver's active ride
router.get('/driver/requests/active', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        const activeRequest = await prisma.transportRequest.findFirst({
            where: { providerId: provider.id, status: { in: ['ACCEPTED', 'ARRIVED_PICKUP', 'IN_TRANSIT'] } },
            include: { patient: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true } } }
        });
        res.json({ success: true, data: activeRequest });
    } catch (error) {
        next(error);
    }
});

// POST /transport/driver/requests/:id/accept - Accept a ride
router.post('/driver/requests/:id/accept', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
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
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// POST /transport/driver/requests/:id/status - Update ride status
router.post('/driver/requests/:id/status', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
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
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            if (status === 'COMPLETED') updateData.completedAt = new Date();
            await prisma.transportProvider.update({ where: { id: provider.id }, data: { status: 'AVAILABLE' } });
        }

        const updated = await prisma.transportRequest.update({ where: { id }, data: updateData, include: { patient: true } });
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// POST /transport/driver/location - Update real-time location
router.post('/driver/location', authenticate, authorize('TRANSPORT_PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({ lat: z.number(), lng: z.number() });
        const { lat, lng } = schema.parse(req.body);

        const provider = await prisma.transportProvider.findUnique({ where: { userId: req.user!.id } });
        if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

        await transportService.updateProviderLocation(provider.id, lat, lng);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// GET /transport/driver/history - Completed rides
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

        res.json({ success: true, data: rides, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
});

export default router;


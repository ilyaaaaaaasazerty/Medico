import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as emergencyService from '../services/emergency.service.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

const broadcastSchema = z.object({
    clinicId: z.string().uuid().optional(),
    message: z.string().min(5),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const delaySchema = z.object({
    clinicId: z.string().uuid().optional(),
    delayMinutes: z.number().min(5).max(180),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().optional(),
});

/**
 * POST /broadcast
 * Send emergency message to all patients with appointments today
 */
router.post('/broadcast', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const data = broadcastSchema.parse(req.body);
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const result = await emergencyService.broadcastEmergency({
        doctorId: doctor.id,
        clinicId: data.clinicId,
        message: data.message,
        affectedDate: new Date(data.date),
    });

    res.json({ success: true, data: result });
}));

/**
 * POST /delay
 * Delay all remaining appointments by X minutes
 */
router.post('/delay', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const data = delaySchema.parse(req.body);
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const result = await emergencyService.delaySchedule({
        doctorId: doctor.id,
        clinicId: data.clinicId,
        delayMinutes: data.delayMinutes,
        affectedDate: new Date(data.date),
        reason: data.reason,
    });

    res.json({ success: true, data: result });
}));

export default router;

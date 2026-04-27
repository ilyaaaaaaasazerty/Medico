import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as bloodDonationService from '../services/blood-donation.service.js';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

/**
 * Helper to get patient ID from user ID
 */
async function getPatientId(userId: string) {
    const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true }
    });
    return patient?.id;
}

/**
 * Create a new blood request
 */
router.post('/requests', async (req: AuthRequest, res: Response, next) => {
    try {
        const patientId = await getPatientId(req.user!.id);
        if (!patientId) return res.status(403).json({ error: 'PATIENT_PROFILE_REQUIRED' });

        const result = await bloodDonationService.createBloodRequest({
            ...req.body,
            patientId,
        });
        return res.status(201).json(result);
    } catch (error) {
        return next(error);
    }
});

/**
 * Get recommended requests for a donor (Limited Info for Privacy)
 */
router.get('/recommended', async (req: AuthRequest, res: Response, next) => {
    try {
        const donorId = await getPatientId(req.user!.id);
        if (!donorId) return res.status(403).json({ error: 'PATIENT_PROFILE_REQUIRED' });

        const results = await bloodDonationService.getRecommendedRequestsForDonor(donorId);

        const sanitizedResults = results.map(r => ({
            id: r.id,
            bloodType: r.bloodType,
            urgency: r.urgency,
            location: r.location,
            unitsRequired: r.unitsRequired,
            createdAt: r.createdAt,
            patientName: r.patient?.firstName || 'Unknown',
        }));

        return res.json(sanitizedResults);
    } catch (error) {
        return next(error);
    }
});

/**
 * Respond to a request (express interest)
 */
router.post('/requests/:id/respond', async (req: AuthRequest, res: Response, next) => {
    try {
        const donorId = await getPatientId(req.user!.id);
        if (!donorId) return res.status(403).json({ error: 'PATIENT_PROFILE_REQUIRED' });

        const result = await bloodDonationService.respondToRequest(req.params.id, donorId, req.body.notes);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

export default router;

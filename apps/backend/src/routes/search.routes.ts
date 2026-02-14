import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as availabilityService from '../services/availability.service.js';
import * as clinicService from '../services/clinic.service.js';
import * as labService from '../services/lab.service.js';

const router = Router();

// ============================================
// PUBLIC SEARCH
// ============================================

/**
 * GET /search
 * Unified search (public)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string || '';
        const [doctors, clinics, labs] = await Promise.all([
            availabilityService.searchDoctors({ name: query, limit: 10 }),
            clinicService.searchClinics(query),
            labService.searchLabs(query)
        ]);

        res.json({
            success: true,
            data: {
                doctors: (doctors as any).doctors || [],
                clinics,
                labs
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /search/doctors
 * Search doctors (public)
 */
router.get('/doctors', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specialty, city, name, page, limit } = req.query;
        const result = await availabilityService.searchDoctors({
            specialtyId: specialty as string,
            city: city as string,
            name: name as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /search/clinics
 * Search clinics (public)
 */
router.get('/clinics', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        const result = await clinicService.searchClinics(q as string || '');
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /search/labs
 * Search labs (public)
 */
router.get('/labs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        const result = await labService.searchLabs(q as string || '');
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /search/doctors/:id
 * Get public doctor profile
 */
router.get('/doctors/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctor = await availabilityService.getPublicDoctorProfile(req.params.id);
        res.json({ success: true, data: doctor });
    } catch (error: any) {
        if (error.message === 'DOCTOR_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        return next(error);
    }
});

/**
 * GET /search/doctors/:id/slots
 * Get available slots for a doctor on a date
 */
router.get('/doctors/:id/slots', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
        const dateStr = dateSchema.parse(req.query.date);
        const clinicId = req.query.clinicId as string | undefined;

        const slots = await availabilityService.generateSlots(
            req.params.id,
            new Date(dateStr),
            clinicId
        );
        res.json({ success: true, data: slots });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        return next(error);
    }
});

export default router;

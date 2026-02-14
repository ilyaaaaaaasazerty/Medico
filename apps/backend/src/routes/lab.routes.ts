import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import * as labService from '../services/lab.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ============================================
// VALIDATION SCHEMAS
// ============================================

const registerLabSchema = z.object({
    name: z.string().min(1).max(200),
    type: z.enum(['LABORATORY', 'DIAGNOSTIC_CENTER', 'PATHOLOGY', 'RADIOLOGY']),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    description: z.string().max(1000).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    homeCollection: z.boolean().optional(),
});

const updateLabSchema = registerLabSchema.partial();

const testSchema = z.object({
    name: z.string().min(1),
    category: z.enum(['BLOOD', 'URINE', 'IMAGING', 'GENETIC', 'PATHOLOGY', 'OTHER']),
    creditCost: z.number().int().positive(),
    description: z.string().optional(),
    preparation: z.string().optional(),
    turnaroundHours: z.number().int().positive().optional(),
});

const technicianSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    qualification: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    licenseNumber: z.string().optional(),
});

const equipmentSchema = z.object({
    name: z.string().min(1),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE']),
});

const labWorkingHoursSchema = z.array(
    z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean(),
    })
);

// ============================================
// HELPERS
// ============================================

const getLabCenterId = async (req: any): Promise<string> => {
    const admin = await prisma.labAdmin.findUnique({
        where: { userId: req.user!.id },
        select: { labCenterId: true },
    });
    if (!admin) throw new Error('LAB_NOT_FOUND');
    return admin.labCenterId;
};

// ============================================
// ROUTES
// ============================================

/**
 * GET /labs/:id/public
 * Get public lab profile
 */
router.get('/:id/public', asyncHandler(async (req: any, res: any) => {
    const lab = await labService.getPublicLabProfile(req.params.id);
    res.json({ success: true, data: lab });
}));

router.post(
    '/',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = registerLabSchema.parse(req.body);
        const lab = await labService.registerLabCenter({
            userId: req.user!.id,
            ...data,
        } as any);
        return res.status(201).json({ success: true, data: lab });
    })
);

router.get(
    '/exists',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const exists = await labService.labProfileExists(req.user!.id);
        return res.json({ success: true, data: { exists } });
    })
);

router.get(
    '/me',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const lab = await labService.getLabByUserId(req.user!.id);
        res.json({ success: true, data: lab });
    })
);

router.put(
    '/me',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = updateLabSchema.parse(req.body);
        const lab = await labService.updateLab(req.user!.id, data as any);
        res.json({ success: true, data: lab });
    })
);

router.get(
    '/me/dashboard',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const dashboard = await labService.getLabDashboard(req.user!.id);
        return res.json({ success: true, data: dashboard });
    })
);

// ============================================
// TEST ROUTES
// ============================================

router.get(
    '/me/tests',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        const tests = await labService.getLabTests(labCenterId);
        return res.json({ success: true, data: tests });
    })
);

router.post(
    '/me/tests',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = testSchema.parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const test = await labService.addLabTest({ labCenterId, ...data } as any);
        return res.status(201).json({ success: true, data: test });
    })
);

router.put(
    '/me/tests/:id',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = testSchema.partial().parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const test = await labService.updateLabTest(req.params.id, labCenterId, data as any);
        return res.json({ success: true, data: test });
    })
);

router.delete(
    '/me/tests/:id',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        await labService.removeLabTest(req.params.id, labCenterId);
        return res.json({ success: true });
    })
);

// ============================================
// TECHNICIAN ROUTES
// ============================================

router.get(
    '/me/technicians',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        const technicians = await labService.getTechnicians(labCenterId);
        return res.json({ success: true, data: technicians });
    })
);

router.post(
    '/me/technicians',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = technicianSchema.parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const technician = await labService.addTechnician({ labCenterId, ...data } as any);
        return res.status(201).json({ success: true, data: technician });
    })
);

router.put(
    '/me/technicians/:id',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = technicianSchema.partial().parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const technician = await labService.updateTechnician(req.params.id, labCenterId, data as any);
        return res.json({ success: true, data: technician });
    })
);

router.delete(
    '/me/technicians/:id',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        await labService.removeTechnician(req.params.id, labCenterId);
        return res.json({ success: true });
    })
);

// ============================================
// EQUIPMENT ROUTES
// ============================================

router.get(
    '/me/equipment',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        const equipment = await labService.getEquipment(labCenterId);
        return res.json({ success: true, data: equipment });
    })
);

router.post(
    '/me/equipment',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = equipmentSchema.parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const equipment = await labService.addEquipment({ labCenterId, ...data } as any);
        return res.status(201).json({ success: true, data: equipment });
    })
);

router.delete(
    '/me/equipment/:id',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        await labService.removeEquipment(req.params.id, labCenterId);
        return res.json({ success: true });
    })
);

// ============================================
// WORKING HOURS ROUTES
// ============================================

router.get(
    '/me/hours',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const labCenterId = await getLabCenterId(req);
        const hours = await labService.getLabWorkingHours(labCenterId);
        return res.json({ success: true, data: hours });
    })
);

router.put(
    '/me/hours',
    authenticate,
    authorize('LAB_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = labWorkingHoursSchema.parse(req.body);
        const labCenterId = await getLabCenterId(req);
        const hours = await labService.setLabWorkingHours(
            data.map((h) => ({ ...h, labCenterId })) as any
        );
        return res.json({ success: true, data: hours });
    })
);

export default router;

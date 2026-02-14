import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import * as clinicService from '../services/clinic.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ============================================
// VALIDATION SCHEMAS
// ============================================

const registerClinicSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
    description: z.string().max(1000).optional(),
    website: z.string().url().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

const updateClinicSchema = registerClinicSchema.partial();

const staffSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['NURSE', 'RECEPTIONIST', 'TECHNICIAN', 'ADMINISTRATIVE', 'OTHER']),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
});

const roomSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['CONSULTATION', 'EXAMINATION', 'PROCEDURE', 'WAITING', 'OTHER']),
});

const workingHoursSchema = z.array(
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

const getClinicId = async (req: any): Promise<string> => {
    const userId = req.user!.id;

    // Check if admin
    const admin = await prisma.clinicAdmin.findUnique({
        where: { userId },
        select: { clinicId: true },
    });

    if (admin) return admin.clinicId;

    // Check if staff
    const staff = await prisma.clinicStaff.findUnique({
        where: { userId },
        select: { clinicId: true },
    });

    if (!staff) throw new Error('CLINIC_NOT_FOUND');
    return staff.clinicId;
};

// ============================================
// ROUTES
// ============================================

/**
 * PUT /clinics/me
 * Update clinic profile
 */
router.put(
    '/me',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = updateClinicSchema.parse(req.body);
        const clinic = await clinicService.updateClinic(req.user!.id, data as any);
        res.json({ success: true, data: clinic });
    })
);

/**
 * GET /clinics/:id/public
 * Get public clinic profile
 */
router.get('/:id/public', asyncHandler(async (req: any, res: any) => {
    const clinic = await clinicService.getPublicClinicProfile(req.params.id);
    res.json({ success: true, data: clinic });
}));

/**
 * POST /clinics
 * Register new clinic
 */
router.post(
    '/',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = registerClinicSchema.parse(req.body);
        const clinic = await clinicService.registerClinic({
            userId: req.user!.id,
            ...data,
        } as any);
        res.status(201).json({ success: true, data: clinic });
    })
);

/**
 * GET /clinics/exists
 * Check if clinic profile exists
 */
router.get(
    '/exists',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const exists = await clinicService.clinicProfileExists(req.user!.id);
        res.json({ success: true, data: { exists } });
    })
);

/**
 * GET /clinics/me
 * Get clinic profile
 */
router.get(
    '/me',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const clinic = await clinicService.getClinicByUserId(req.user!.id);
        res.json({ success: true, data: clinic });
    })
);

/**
 * PUT /clinics/me
 * Update clinic profile
 */
router.put(
    '/me',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = updateClinicSchema.parse(req.body);
        const clinic = await clinicService.updateClinic(req.user!.id, data as any);
        res.json({ success: true, data: clinic });
    })
);

/**
 * GET /clinics/me/dashboard
 * Get clinic dashboard
 */
router.get(
    '/me/dashboard',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const dashboard = await clinicService.getClinicDashboard(req.user!.id, req.user!.role);
        res.json({ success: true, data: dashboard });
    })
);

// ============================================
// STAFF ROUTES
// ============================================

router.get(
    '/me/staff',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const staff = await clinicService.getClinicStaff(clinicId);
        res.json({ success: true, data: staff });
    })
);

router.post(
    '/me/staff',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = staffSchema.parse(req.body);
        const clinicId = await getClinicId(req);
        const staff = await clinicService.addStaffMember({ clinicId, ...data } as any);
        res.status(201).json({ success: true, data: staff });
    })
);

router.get(
    '/me/staff/:id',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const staff = await clinicService.getStaffMemberById(req.params.id, clinicId);
        res.json({ success: true, data: staff });
    })
);

router.put(
    '/me/staff/:id',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = staffSchema.partial().parse(req.body);
        const clinicId = await getClinicId(req);
        const staff = await clinicService.updateStaff(req.params.id, clinicId, data as any);
        res.json({ success: true, data: staff });
    })
);

router.delete(
    '/me/staff/:id',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        await clinicService.removeStaff(req.params.id, clinicId);
        res.json({ success: true });
    })
);

// ============================================
// ROOM ROUTES
// ============================================

router.get(
    '/me/rooms',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const rooms = await clinicService.getRooms(clinicId);
        res.json({ success: true, data: rooms });
    })
);

router.post(
    '/me/rooms',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = roomSchema.parse(req.body);
        const clinicId = await getClinicId(req);
        const room = await clinicService.addRoom({ clinicId, ...data } as any);
        res.status(201).json({ success: true, data: room });
    })
);

router.put(
    '/me/rooms/:id',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = roomSchema.partial().parse(req.body);
        const clinicId = await getClinicId(req);
        const room = await clinicService.updateRoom(req.params.id, clinicId, data as any);
        res.json({ success: true, data: room });
    })
);

router.delete(
    '/me/rooms/:id',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        await clinicService.removeRoom(req.params.id, clinicId);
        res.json({ success: true });
    })
);

// ============================================
// WORKING HOURS ROUTES
// ============================================

router.get(
    '/me/hours',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const hours = await clinicService.getWorkingHours(clinicId);
        res.json({ success: true, data: hours });
    })
);

router.put(
    '/me/hours',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const data = workingHoursSchema.parse(req.body);
        const clinicId = await getClinicId(req);
        const hours = await clinicService.setWorkingHours(
            data.map((h) => ({ ...h, clinicId })) as any
        );
        res.json({ success: true, data: hours });
    })
);

// ============================================
// DOCTOR AFFILIATION ROUTES
// ============================================

router.get(
    '/me/doctors',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const doctors = await clinicService.getAffiliatedDoctors(clinicId);
        res.json({ success: true, data: doctors });
    })
);

router.post(
    '/me/doctors',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const { doctorId } = z.object({ doctorId: z.string().uuid() }).parse(req.body);
        const clinicId = await getClinicId(req);
        const affiliation = await clinicService.addDoctorAffiliation(clinicId, doctorId);
        res.status(201).json({ success: true, data: affiliation });
    })
);

router.delete(
    '/me/doctors/:doctorId',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        await clinicService.removeDoctorAffiliation(clinicId, req.params.doctorId);
        res.json({ success: true });
    })
);

// ============================================
// APPOINTMENTS
// ============================================

router.get(
    '/me/appointments',
    authenticate,
    authorize('CLINIC_ADMIN', 'STAFF'),
    asyncHandler(async (req: any, res: any) => {
        const clinicId = await getClinicId(req);
        const { status, date, doctorId } = req.query;
        const appointments = await clinicService.getClinicAppointments(clinicId, {
            status: status as string | undefined,
            date: date as string | undefined,
            doctorId: doctorId as string | undefined,
        });
        res.json({ success: true, data: appointments });
    })
);

/**
 * POST /clinics/me/emergency
 * Toggle emergency mode
 */
router.post(
    '/me/emergency',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const { active } = z.object({ active: z.boolean() }).parse(req.body);
        const clinic = await clinicService.toggleEmergencyMode(req.user!.id, active);
        res.json({ success: true, data: clinic });
    })
);

/**
 * POST /clinics/me/setback
 * Shift schedule by delay
 */
router.post(
    '/me/setback',
    authenticate,
    authorize('CLINIC_ADMIN'),
    asyncHandler(async (req: any, res: any) => {
        const { delayMinutes } = z.object({ delayMinutes: z.number().int().min(1).max(240) }).parse(req.body);
        await clinicService.shiftSchedule(req.user!.id, delayMinutes);
        res.json({ success: true });
    })
);

export default router;

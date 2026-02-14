import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as appointmentService from '../services/appointment.service.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { storage as upload } from '../lib/storage.js';

// Multer S3 Middleware imported as 'upload'

const router = Router();

router.use(authenticate);

// Validation Schemas
const createAppointmentSchema = z.object({
    doctorId: z.string().uuid(),
    clinicId: z.string().uuid().optional(),
    serviceId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    type: z.enum(['IN_PERSON', 'VIDEO_CALL', 'HOME_VISIT']),
    reason: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'ONLINE', 'WALLET']),
});

const rescheduleSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'IN_PROGRESS']),
});

/**
 * POST /
 * Book an appointment
 */
router.post('/', asyncHandler(async (req: any, res: any) => {
    console.log('[DEBUG] Appointment Body:', JSON.stringify(req.body, null, 2));
    const data = createAppointmentSchema.parse(req.body);
    const userId = req.user!.id;

    // Get Patient Profile ID
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
        return res.status(403).json({ success: false, error: 'User is not a registered patient' });
    }

    const appointment = await appointmentService.createAppointment({
        patientId: patient.id,
        scheduledDate: new Date(data.date),
        scheduledTime: data.time,
        doctorId: data.doctorId,
        clinicId: data.clinicId,
        serviceId: data.serviceId,
        type: data.type,
        reason: data.reason,
        patientNotes: data.notes,
    } as any);

    res.status(201).json({ success: true, data: appointment });
}));

/**
 * POST /:id/attachments
 * Upload attachment for appointment
 */
router.post('/:id/attachments', upload.single('file'), asyncHandler(async (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { getFileUrl } = await import('../lib/storage.js');
    const filename = req.file.filename;
    const fileUrl = getFileUrl(filename);

    const attachment = await appointmentService.addAttachment(req.params.id, {
        name: req.body.name || req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: (req as any).user!.id
    });

    res.status(201).json({ success: true, data: attachment });
}));

/**
 * GET /
 * List my appointments (Patient)
 */
router.get('/', asyncHandler(async (req: any, res: any) => {
    const userId = req.user!.id;
    const patient = await prisma.patient.findUnique({ where: { userId } });

    if (patient) {
        const appointments = await appointmentService.getPatientAppointments(patient.id);
        return res.json({ success: true, data: appointments });
    }

    res.status(403).json({ success: false, error: 'Patient profile not found' });
}));

/**
 * GET /doctor/list
 * List doctor's appointments
 */
router.get('/doctor/list', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const userId = req.user!.id;
    const doctor = await prisma.doctor.findUnique({ where: { userId } });

    if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    const { date, status } = req.query;
    const appointments = await appointmentService.getDoctorAppointments(
        doctor.id,
        date as string,
        status as any
    );
    res.json({ success: true, data: appointments });
}));

/**
 * GET /:id
 * Get details
 */
router.get('/:id', asyncHandler(async (req: any, res: any) => {
    const appointment = await appointmentService.getAppointment(req.params.id);
    res.json({ success: true, data: appointment });
}));

/**
 * PUT /:id/status
 * Update status
 */
router.put('/:id/status', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const { status } = updateStatusSchema.parse(req.body);
    const result = await appointmentService.updateAppointmentStatus(req.params.id, status);
    res.json({ success: true, data: result });
}));

/**
 * PUT /:id/cancel
 */
router.put('/:id/cancel', asyncHandler(async (req: any, res: any) => {
    const { reason } = req.body;
    const result = await appointmentService.cancelAppointment(req.params.id, req.user!.id, reason);
    res.json({ success: true, data: result });
}));

/**
 * PUT /:id/reschedule
 */
router.put('/:id/reschedule', asyncHandler(async (req: any, res: any) => {
    const data = rescheduleSchema.parse(req.body);
    const result = await appointmentService.rescheduleAppointment(req.params.id, data);
    res.json({ success: true, data: result });
}));

/**
 * PUT /:id/finalize
 * Complete visit + AI Anonymization
 */
router.put('/:id/finalize', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const result = await appointmentService.finalizeVisit(req.params.id, req.user.id);
    res.json({ success: true, data: result });
}));

/**
 * POST /:id/call
 * Call patient to consultation room
 */
router.post('/:id/call', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const result = await appointmentService.callPatient(req.params.id);
    res.json({ success: true, data: result });
}));

/**
 * POST /:id/orders
 * Create a clinical order (LAB, IMAGING, PROCEDURE)
 */
import * as clinicalOrderService from '../services/clinical-order.service.js';
router.post('/:id/orders', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const data = z.object({
        type: z.enum(['LAB', 'IMAGING', 'PROCEDURE', 'REFERRAL']),
        description: z.string().optional(),
        metadata: z.any().optional(),
        recordId: z.string().uuid().optional(),
    }).parse(req.body);

    const order = await clinicalOrderService.createOrder({
        appointmentId: req.params.id,
        ...data
    } as any);

    res.status(201).json({ success: true, data: order });
}));

export default router;

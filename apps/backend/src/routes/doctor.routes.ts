import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import * as doctorService from '../services/doctor.service.js';
import * as patientService from '../services/patient.service.js';
import { PDFService } from '../services/pdf.service.js';
import { documentsService } from '../services/documents.service.js';
import { prisma } from '../lib/prisma.js';
import * as templateService from '../services/template.service.js';
import { storage as upload, getFileUrl } from '../lib/storage.js';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createDoctorSchema = z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    licenseNumber: z.string().min(1),
    licenseExpiry: z.string().transform((s) => new Date(s)),
    yearsExperience: z.number().int().positive().optional(),
    bio: z.string().max(1000).optional(),
    consultationFee: z.number().positive().optional(),
});

const updateDoctorSchema = createDoctorSchema.partial().extend({
    avatarUrl: z.string().url().optional(),
});

const educationSchema = z.object({
    degree: z.string().min(1),
    institution: z.string().min(1),
    year: z.number().int().min(1950).max(new Date().getFullYear()),
});

const documentSchema = z.object({
    type: z.string().min(1),
    url: z.string().url(),
    name: z.string().min(1),
});

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Get all specialties
router.get('/specialties', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const specialties = await doctorService.getAllSpecialties();
        res.json({ success: true, data: specialties });
    } catch (error) {
        return next(error);
    }
});

// ============================================
// AUTHENTICATED DOCTOR ROUTES
// ============================================

router.use(authenticate);

// Find doctor (Clinic/Staff access)
router.get('/find', authorize('CLINIC_ADMIN', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string;
        if (!query) return res.status(400).json({ success: false, error: 'Query required' });

        const doctor = await doctorService.findDoctorByEmailOrId(query);
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

        return res.json({ success: true, data: doctor });
    } catch (error) {
        return next(error);
    }
});

router.use(authorize('DOCTOR'));

// Helper to get doctor ID from user
async function getDoctorId(req: Request): Promise<string> {
    const doctor = await doctorService.getDoctorByUserId((req as any).user!.id);
    return doctor.id;
}

// Create doctor profile
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createDoctorSchema.parse(req.body);
        const doctor = await doctorService.createDoctorProfile({
            userId: (req as any).user!.id,
            ...data,
        } as any);
        return res.status(201).json({ success: true, data: doctor });
    } catch (error: any) {
        if (error.message === 'PROFILE_EXISTS') {
            return res.status(409).json({ success: false, error: 'Profile already exists' });
        }
        return next(error);
    }
});

// Check if profile exists
router.get('/exists', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const exists = await doctorService.doctorProfileExists((req as any).user!.id);
        return res.json({ success: true, data: { exists } });
    } catch (error) {
        return next(error);
    }
});

// Get current doctor profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctor = await doctorService.getDoctorByUserId((req as any).user!.id);
        res.json({ success: true, data: doctor });
    } catch (error: any) {
        if (error.message === 'DOCTOR_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Doctor profile not found' });
        }
        return next(error);
    }
});

// Get dashboard data
router.get('/me/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await doctorService.getDoctorDashboard((req as any).user!.id);
        return res.json({ success: true, data: dashboard });
    } catch (error: any) {
        if (error.message === 'DOCTOR_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Doctor profile not found' });
        }
        return next(error);
    }
});

// Get doctor appointments
router.get('/me/appointments', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const start = req.query.start as string | undefined;
        const end = req.query.end as string | undefined;
        const status = req.query.status as string | undefined;

        const appointments = await doctorService.getDoctorAppointments(doctorId, status, start, end);
        return res.json({ success: true, data: appointments });
    } catch (error) {
        return next(error);
    }
});

// Get verification status
router.get('/me/verification', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = await doctorService.getVerificationStatus((req as any).user!.id);
        return res.json({ success: true, data: status });
    } catch (error: any) {
        if (error.message === 'DOCTOR_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Doctor profile not found' });
        }
        return next(error);
    }
});

// Update doctor profile
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateDoctorSchema.parse(req.body);
        const doctor = await doctorService.updateDoctorProfile((req as any).user!.id, data as any);
        res.json({ success: true, data: doctor });
    } catch (error: any) {
        if (error.message === 'DOCTOR_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Doctor profile not found' });
        }
        return next(error);
    }
});

// ============================================
// EDUCATION
// ============================================

router.get('/me/education', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const education = await doctorService.getEducation(doctorId);
        return res.json({ success: true, data: education });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/education', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = educationSchema.parse(req.body);
        const education = await doctorService.addEducation({ doctorId, ...data } as any);
        return res.status(201).json({ success: true, data: education });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/education/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await doctorService.removeEducation(doctorId, req.params.id);
        return res.json({ success: true, message: 'Education removed' });
    } catch (error: any) {
        if (error.message === 'EDUCATION_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Education not found' });
        }
        return next(error);
    }
});

// ============================================
// DOCUMENTS
// ============================================

router.get('/me/documents', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const documents = await doctorService.getDocuments(doctorId);
        res.json({ success: true, data: documents });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/documents', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = documentSchema.parse(req.body);
        const document = await doctorService.addDocument({
            doctorId,
            type: data.type,
            fileUrl: (data as any).url,
            fileName: (data as any).name
        } as any);
        return res.status(201).json({ success: true, data: document });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await doctorService.removeDocument(doctorId, req.params.id);
        return res.json({ success: true, message: 'Document removed' });
    } catch (error: any) {
        if (error.message === 'DOCUMENT_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        return next(error);
    }
});

// ============================================
// SPECIALTIES
// ============================================

router.get('/me/specialties', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const specialties = await doctorService.getDoctorSpecialties(doctorId);
        res.json({ success: true, data: specialties });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/specialties', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const { specialtyId } = z.object({ specialtyId: z.string().uuid() }).parse(req.body);
        const specialty = await doctorService.addDoctorSpecialty(doctorId, specialtyId);
        return res.status(201).json({ success: true, data: specialty });
    } catch (error: any) {
        if (error.message === 'SPECIALTY_ALREADY_ADDED') {
            return res.status(409).json({ success: false, error: 'Specialty already added' });
        }
        return next(error);
    }
});

router.delete('/me/specialties/:specialtyId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await doctorService.removeDoctorSpecialty(doctorId, req.params.specialtyId);
        return res.json({ success: true, message: 'Specialty removed' });
    } catch (error: any) {
        if (error.message === 'SPECIALTY_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Specialty not found' });
        }
        return next(error);
    }
});

// ============================================
// AVAILABILITY MANAGEMENT
// ============================================

import * as availabilityService from '../services/availability.service.js';

const availabilitySchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    slotDuration: z.number().int().min(5).max(120),
    clinicId: z.string().uuid().optional(),
});

const exceptionSchema = z.object({
    date: z.string().transform((s) => new Date(s)),
    isBlocked: z.boolean().optional(),
    reason: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// Get availability
router.get('/me/availability', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const clinicId = req.query.clinicId as string | undefined;
        const availability = await availabilityService.getAvailability(doctorId, clinicId);
        res.json({ success: true, data: availability });
    } catch (error) {
        return next(error);
    }
});

// Set availability for a day
router.post('/me/availability', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = availabilitySchema.parse(req.body);
        const availability = await availabilityService.setAvailability({ doctorId, ...data } as any);
        return res.status(201).json({ success: true, data: availability });
    } catch (error) {
        return next(error);
    }
});

// Update availability
router.put('/me/availability/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = availabilitySchema.partial().parse(req.body);
        const availability = await availabilityService.updateAvailability(req.params.id, doctorId, data as any);
        res.json({ success: true, data: availability });
    } catch (error: any) {
        if (error.message === 'AVAILABILITY_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Availability not found' });
        }
        return next(error);
    }
});

// Delete availability
router.delete('/me/availability/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await availabilityService.removeAvailability(req.params.id, doctorId);
        res.json({ success: true });
    } catch (error: any) {
        if (error.message === 'AVAILABILITY_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Availability not found' });
        }
        return next(error);
    }
});

// ============================================
// AVAILABILITY EXCEPTIONS
// ============================================

// Get exceptions
router.get('/me/exceptions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
        const exceptions = await availabilityService.getExceptions(doctorId, fromDate);
        return res.json({ success: true, data: exceptions });
    } catch (error) {
        return next(error);
    }
});

// Add exception (block time)
router.post('/me/exceptions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = exceptionSchema.parse(req.body);
        const exception = await availabilityService.addException({ doctorId, ...data } as any);
        return res.status(201).json({ success: true, data: exception });
    } catch (error) {
        return next(error);
    }
});

// Remove exception
router.delete('/me/exceptions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await availabilityService.removeException(req.params.id, doctorId);
        res.json({ success: true });
    } catch (error: any) {
        if (error.message === 'EXCEPTION_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Exception not found' });
        }
        return next(error);
    }
});

// ============================================
// MEDICAL RECORDS & PRESCRIPTIONS
// ============================================

import { medicalRecordsService } from '../services/medical-records.service.js';
import { prescriptionsService } from '../services/prescriptions.service.js';

const recordSchema = z.object({
    patientId: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    familyMemberId: z.string().uuid().optional(),
    visitDate: z.string().transform((s) => new Date(s)),
    chiefComplaint: z.string().optional(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    notes: z.string().optional(),
    bloodPressure: z.string().optional(),
    heartRate: z.number().int().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    followUpDate: z.string().transform((s) => new Date(s)).optional(),
    followUpNotes: z.string().optional(),
});

const prescriptionSchema = z.object({
    appointmentId: z.string().uuid().optional(),
    recordId: z.string().uuid().optional(),
    patientId: z.string().uuid(),
    diagnosis: z.string().optional(),
    instructions: z.string().optional(),
    validUntil: z.string().transform((s) => new Date(s)).optional(),
    items: z.array(z.object({
        medication: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
        instructions: z.string().optional(),
        quantity: z.number().int().optional(),
    })),
});

const templateSchema = z.object({
    name: z.string().min(1),
    diagnosis: z.string().optional(),
    medications: z.any(),
    instructions: z.string().optional(),
});

// Create medical record for appointment (or update if already exists)
router.post('/appointments/:appointmentId/record', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = recordSchema.omit({ appointmentId: true }).parse(req.body);

        // Check if record already exists for this appointment
        const existing = await medicalRecordsService.getRecordByAppointmentId(req.params.appointmentId);

        let record;
        if (existing) {
            // Update existing record
            record = await medicalRecordsService.updateRecord(existing.id, data as any);
        } else {
            // Create new record
            record = await medicalRecordsService.createRecord({
                ...data,
                doctorId,
                appointmentId: req.params.appointmentId,
            } as any);
        }

        return res.status(existing ? 200 : 201).json({ success: true, data: record });
    } catch (error) {
        return next(error);
    }
});

// Update medical record
router.put('/appointments/:appointmentId/record', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existing = await medicalRecordsService.getRecordByAppointmentId(req.params.appointmentId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        const data = recordSchema.partial().parse(req.body);
        const record = await medicalRecordsService.updateRecord(existing.id, data as any);
        res.json({ success: true, data: record });
    } catch (error) {
        return next(error);
    }
});

// Get patient's records (for doctor)
router.get('/patients/:patientId/records', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const records = await medicalRecordsService.getDoctorPatientRecords(doctorId, req.params.patientId);
        res.json({ success: true, data: records });
    } catch (error) {
        return next(error);
    }
});

// Get all doctor's records
router.get('/me/records', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const patientId = req.query.patientId as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const records = await medicalRecordsService.getDoctorRecords(doctorId, {
            patientId,
            limit,
            offset,
        });
        res.json({ success: true, data: records });
    } catch (error) {
        return next(error);
    }
});

// Get patient's documents (for doctor/clinic/lab)
router.get('/patients/:patientId/documents', authorize('DOCTOR', 'CLINIC_ADMIN', 'LAB_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const documents = await documentsService.getPatientDocuments(req.params.patientId);
        res.json({ success: true, data: documents });
    } catch (error) {
        return next(error);
    }
});

// Get patient's health profile (for doctor)
router.get('/patients/:patientId/health-profile', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { patientId } = z.object({ patientId: z.string().uuid() }).parse(req.params);
        const profile = await patientService.getPatientHealthProfile(patientId);
        res.json({ success: true, data: profile });
    } catch (error: any) {
        console.error(`[DoctorAPI] Error fetching health profile for patient ${req.params.patientId}:`, error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid patient ID format' });
        }
        return next(error);
    }
});

// Download patient record PDF
router.get('/appointments/:appointmentId/record/pdf', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await medicalRecordsService.getRecordByAppointmentId(req.params.appointmentId);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visit-summary-${req.params.appointmentId}.pdf`);

        await PDFService.generateVisitSummaryPDF(record, res);
    } catch (error) {
        return next(error);
    }
});

// Create prescription (or update if one already exists for this appointment)
// Also creates a medical record if one doesn't exist
router.post('/appointments/:appointmentId/prescription', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = prescriptionSchema.omit({ appointmentId: true }).parse(req.body);

        // Get appointment details
        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.appointmentId },
            select: { patientId: true, scheduledDate: true }
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Check if prescription already exists for this appointment
        const existingPrescription = await prisma.prescription.findUnique({
            where: { appointmentId: req.params.appointmentId }
        });

        // Check if medical record already exists for this appointment
        let record = await prisma.medicalRecord.findUnique({
            where: { appointmentId: req.params.appointmentId }
        });

        // Create medical record if it doesn't exist
        if (!record) {
            record = await prisma.medicalRecord.create({
                data: {
                    patientId: appointment.patientId,
                    doctorId,
                    appointmentId: req.params.appointmentId,
                    visitDate: appointment.scheduledDate,
                    diagnosis: data.diagnosis,
                }
            });
        }

        if (existingPrescription) {
            // Update existing prescription & link to record
            const updated = await prisma.prescription.update({
                where: { id: existingPrescription.id },
                data: {
                    diagnosis: data.diagnosis,
                    instructions: data.instructions,
                    recordId: record.id,
                    items: {
                        deleteMany: {},
                        create: data.items,
                    },
                },
                include: { items: true },
            });
            return res.json({ success: true, data: updated });
        }

        // Create new prescription linked to the record
        const prescription = await prescriptionsService.createPrescription({
            ...data,
            doctorId,
            appointmentId: req.params.appointmentId,
            recordId: record.id,
        } as any);
        return res.status(201).json({ success: true, data: prescription });
    } catch (error) {
        return next(error);
    }
});

// Get single record by ID (for doctor)
router.get('/records/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await medicalRecordsService.getRecordById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        return next(error);
    }
});

// Upload temporary prescription signature
router.post('/prescriptions/signature', authenticate, authorize('DOCTOR'), upload.single('signature'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No signature file uploaded' });
        }
        const signatureUrl = getFileUrl(req.file.filename);
        return res.json({ success: true, data: { signatureUrl } });
    } catch (error) {
        console.error('Error uploading signature:', error);
        return res.status(500).json({ success: false, error: 'Failed to upload signature' });
    }
});

// Get prescription
router.get('/prescriptions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prescription = await prescriptionsService.getPrescriptionById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found' });
        }
        return res.json({ success: true, data: prescription });
    } catch (error) {
        return next(error);
    }
});

// Download prescription PDF
router.get('/prescriptions/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prescription = await prescriptionsService.getPrescriptionById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${req.params.id}.pdf`);

        const template = await templateService.getApplicableTemplate(prescription.doctorId);
        await PDFService.generatePrescriptionPDF(prescription, res, template);
    } catch (error) {
        return next(error);
    }
});

// Get doctor's prescriptions
router.get('/me/prescriptions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const patientId = req.query.patientId as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

        const prescriptions = await prescriptionsService.getDoctorPrescriptions(doctorId, {
            patientId,
            limit,
        });
        return res.json({ success: true, data: prescriptions });
    } catch (error) {
        return next(error);
    }
});

// ============================================
// PRESCRIPTION TEMPLATES
// ============================================

// Get templates
router.get('/me/templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const templates = await prescriptionsService.getTemplates(doctorId);
        return res.json({ success: true, data: templates });
    } catch (error) {
        return next(error);
    }
});

// Create template
router.post('/me/templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = templateSchema.parse(req.body);

        const template = await prescriptionsService.createTemplate({
            ...data,
            doctorId,
        } as any);
        return res.status(201).json({ success: true, data: template });
    } catch (error) {
        return next(error);
    }
});

// Get single template
router.get('/me/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const template = await prescriptionsService.getTemplateById(req.params.id, doctorId);

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        return res.json({ success: true, data: template });
    } catch (error) {
        return next(error);
    }
});

// Update template
router.put('/me/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        const data = templateSchema.partial().parse(req.body);

        await prescriptionsService.updateTemplate(req.params.id, doctorId, data);
        return res.json({ success: true, message: 'Template updated' });
    } catch (error) {
        return next(error);
    }
});

// Delete template
router.delete('/me/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = await getDoctorId(req);
        await prescriptionsService.deleteTemplate(req.params.id, doctorId);
        return res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        return next(error);
    }
});

/**
 * POST /doctors/me/emergency
 * Toggle emergency mode
 */
router.post('/me/emergency', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { active } = z.object({ active: z.boolean() }).parse(req.body);
        const doctor = await doctorService.toggleEmergencyMode((req as any).user!.id, active);
        res.json({ success: true, data: doctor });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /doctors/me/setback
 * Shift schedule by delay
 */
router.post('/me/setback', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { delayMinutes } = z.object({ delayMinutes: z.number().int().min(-240).max(240) }).parse(req.body);
        await doctorService.shiftSchedule((req as any).user!.id, delayMinutes);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;


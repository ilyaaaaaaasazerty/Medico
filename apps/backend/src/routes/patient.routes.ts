import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import * as patientService from '../services/patient.service.js';
import * as familyService from '../services/family.service.js';
import * as healthService from '../services/health.service.js';
import { PDFService } from '../services/pdf.service.js';
import * as templateService from '../services/template.service.js';
import { storage as upload } from '../lib/storage.js';

// Multer S3 Middleware imported as 'upload'

const router = Router();

// All patient routes require authentication and PATIENT role
router.use(authenticate);
router.use(authorize('PATIENT'));

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createPatientSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    dateOfBirth: z.string().transform((s) => new Date(s)),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodType: z.enum([
        'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
        'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'
    ]).optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    address: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    emergencyName: z.string().max(100).optional(),
    emergencyPhone: z.string().max(20).optional(),

    // Phase 13: Digital Identity
    insuranceProvider: z.string().max(100).optional(),
    insurancePolicyNumber: z.string().max(50).optional(),
    insuranceGroupNumber: z.string().max(50).optional(),
    insuranceImageFront: z.string().url().max(1000).optional(),
    insuranceImageBack: z.string().url().max(1000).optional(),
    primaryCarePhysician: z.string().max(100).optional(),
    primaryPharmacy: z.string().max(200).optional(),
    smokingStatus: z.enum(['NEVER', 'FORMER', 'CURRENT']).optional(),
    alcoholStatus: z.enum(['NONE', 'OCCASIONAL', 'REGULAR']).optional(),
    dietaryHabits: z.string().max(500).optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const familyMemberSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    dateOfBirth: z.string().transform((s) => new Date(s)),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    relationship: z.enum(['CHILD', 'SPOUSE', 'PARENT', 'SIBLING', 'OTHER']),
    bloodType: z.enum([
        'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
        'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'
    ]).optional(),
});

const allergySchema = z.object({
    name: z.string().min(1).max(100),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    reaction: z.string().max(500).optional(),
});

const conditionSchema = z.object({
    name: z.string().min(1).max(100),
    diagnosedAt: z.string().transform((s) => new Date(s)).optional(),
    notes: z.string().max(1000).optional(),
});

const medicationSchema = z.object({
    name: z.string().min(1).max(100),
    dosage: z.string().min(1).max(50),
    frequency: z.string().min(1).max(50),
    startDate: z.string().transform((s) => new Date(s)),
    endDate: z.string().transform((s) => new Date(s)).optional(),
});

const vaccinationSchema = z.object({
    name: z.string().min(1).max(100),
    dateGiven: z.string().transform((s) => new Date(s)),
    provider: z.string().max(100).optional(),
    nextDueDate: z.string().transform((s) => new Date(s)).optional(),
});

const vitalSchema = z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string(),
    recordedAt: z.string().transform((s) => new Date(s)),
    notes: z.string().optional(),
});

// Helper to get patient ID from user
async function getPatientId(req: Request): Promise<string> {
    const patient = await patientService.getPatientByUserId((req as any).user!.id);
    return patient.id;
}

// ============================================
// PATIENT PROFILE
// ============================================

// Create patient profile
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createPatientSchema.parse(req.body);
        const patient = await patientService.createPatientProfile({
            userId: (req as any).user!.id,
            ...data,
        } as any);
        return res.status(201).json({ success: true, data: patient });
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
        console.log(`[Patient] Checking profile existence for user: ${(req as any).user!.id}`);
        const exists = await patientService.patientProfileExists((req as any).user!.id);
        return res.json({ success: true, data: { exists } });
    } catch (error) {
        return next(error);
    }
});

// Get current patient profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patient = await patientService.getPatientByUserId((req as any).user!.id);
        res.json({ success: true, data: patient });
    } catch (error: any) {
        if (error.message === 'PATIENT_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Patient profile not found' });
        }
        return next(error);
    }
});

// Get dashboard data
router.get('/me/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await patientService.getPatientDashboard((req as any).user!.id);
        return res.json({ success: true, data: dashboard });
    } catch (error: any) {
        if (error.message === 'PATIENT_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Patient profile not found' });
        }
        return next(error);
    }
});

// Update patient profile
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updatePatientSchema.parse(req.body);
        const patient = await patientService.updatePatientProfile((req as any).user!.id, data as any);
        res.json({ success: true, data: patient });
    } catch (error: any) {
        if (error.message === 'PATIENT_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Patient profile not found' });
        }
        return next(error);
    }
});

// ============================================
// FAMILY MEMBERS
// ============================================

router.get('/me/family', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const members = await familyService.getFamilyMembers(patientId);
        return res.json({ success: true, data: members });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/family', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = familyMemberSchema.parse(req.body);
        const member = await familyService.addFamilyMember({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: member });
    } catch (error) {
        return next(error);
    }
});

router.put('/me/family/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = familyMemberSchema.partial().parse(req.body);
        const member = await familyService.updateFamilyMember(patientId, req.params.id, data);
        return res.json({ success: true, data: member });
    } catch (error: any) {
        if (error.message === 'FAMILY_MEMBER_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Family member not found' });
        }
        return next(error);
    }
});

router.delete('/me/family/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await familyService.removeFamilyMember(patientId, req.params.id);
        return res.json({ success: true, message: 'Family member removed' });
    } catch (error: any) {
        if (error.message === 'FAMILY_MEMBER_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Family member not found' });
        }
        return next(error);
    }
});

// ============================================
// ALLERGIES
// ============================================

router.get('/me/allergies', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = await healthService.getAllergies(patientId);
        return res.json({ success: true, data });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/allergies', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = allergySchema.parse(req.body);
        const allergy = await healthService.addAllergy({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: allergy });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/allergies/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await healthService.removeAllergy(patientId, req.params.id);
        return res.json({ success: true, message: 'Allergy removed' });
    } catch (error: any) {
        if (error.message === 'ALLERGY_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Allergy not found' });
        }
        return next(error);
    }
});

// ============================================
// CHRONIC CONDITIONS
// ============================================

router.get('/me/conditions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = await healthService.getConditions(patientId);
        return res.json({ success: true, data });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/conditions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = conditionSchema.parse(req.body);
        const condition = await healthService.addCondition({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: condition });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/conditions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await healthService.removeCondition(patientId, req.params.id);
        return res.json({ success: true, message: 'Condition removed' });
    } catch (error: any) {
        if (error.message === 'CONDITION_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Condition not found' });
        }
        return next(error);
    }
});

// ============================================
// MEDICATIONS
// ============================================

router.get('/me/medications', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = await healthService.getMedications(patientId);
        return res.json({ success: true, data });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/medications', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = medicationSchema.parse(req.body);
        const medication = await healthService.addMedication({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: medication });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/medications/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await healthService.removeMedication(patientId, req.params.id);
        return res.json({ success: true, message: 'Medication removed' });
    } catch (error: any) {
        if (error.message === 'MEDICATION_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Medication not found' });
        }
        return next(error);
    }
});

// ============================================
// VACCINATIONS
// ============================================

router.get('/me/vaccinations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = await healthService.getVaccinations(patientId);
        return res.json({ success: true, data });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/vaccinations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = vaccinationSchema.parse(req.body);
        const vaccination = await healthService.addVaccination({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: vaccination });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/vaccinations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await healthService.removeVaccination(patientId, req.params.id);
        return res.json({ success: true, message: 'Vaccination removed' });
    } catch (error: any) {
        if (error.message === 'VACCINATION_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Vaccination not found' });
        }
        return next(error);
    }
});

// ============================================
// VITAL SIGNS
// ============================================

router.get('/me/vitals', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const type = req.query.type as any;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const data = await healthService.getVitals(patientId, type, limit);
        return res.json({ success: true, data });
    } catch (error) {
        return next(error);
    }
});

router.post('/me/vitals', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const data = vitalSchema.parse(req.body);
        const vital = await healthService.addVital({ patientId, ...data } as any);
        return res.status(201).json({ success: true, data: vital });
    } catch (error) {
        return next(error);
    }
});

router.delete('/me/vitals/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await healthService.removeVital(patientId, req.params.id);
        return res.json({ success: true, message: 'Vital reading removed' });
    } catch (error: any) {
        if (error.message === 'VITAL_NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Vital reading not found' });
        }
        return next(error);
    }
});

// ============================================
// MEDICAL RECORDS
// ============================================

import { medicalRecordsService } from '../services/medical-records.service.js';
import { documentsService } from '../services/documents.service.js';
import { prescriptionsService } from '../services/prescriptions.service.js';

// Get patient's medical records timeline
router.get('/me/records', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const familyMemberId = req.query.familyMemberId as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const records = await medicalRecordsService.getPatientRecords(patientId, {
            familyMemberId,
            limit,
            offset,
        });
        return res.json({ success: true, data: records });
    } catch (error) {
        return next(error);
    }
});

// Get single record
router.get('/me/records/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const record = await medicalRecordsService.getRecordById(req.params.id, patientId);

        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        return res.json({ success: true, data: record });
    } catch (error) {
        return next(error);
    }
});

// Download record PDF
router.get('/me/records/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const record = await medicalRecordsService.getRecordById(req.params.id, patientId);

        if (!record) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visit-summary-${req.params.id}.pdf`);

        await PDFService.generateVisitSummaryPDF(record, res);
    } catch (error) {
        return next(error);
    }
});

// ============================================
// DOCUMENTS
// ============================================

// const documentUploadSchema = z.object({
//     type: z.enum(['LAB_RESULT', 'PRESCRIPTION', 'IMAGING', 'REPORT', 'INSURANCE', 'ID_DOCUMENT', 'OTHER']),
//     name: z.string().min(1),
//     fileUrl: z.string().url(),
//     fileSize: z.number().optional(),
//     mimeType: z.string().optional(),
//     recordId: z.string().optional(),
// });

// Get patient's documents
router.get('/me/documents', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const type = req.query.type as any;
        const recordId = req.query.recordId as string | undefined;

        const documents = await documentsService.getPatientDocuments(patientId, {
            type,
            recordId,
        });
        return res.json({ success: true, data: documents });
    } catch (error) {
        return next(error);
    }
});

// Upload document
router.post('/me/documents', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);

        let fileUrl = req.body.fileUrl;
        if (req.file) {
            const { getFileUrl } = await import('../lib/storage.js');
            fileUrl = getFileUrl(req.file.filename);
        }

        // Validate required fields
        if (!req.body.name || !req.body.type) {
            return res.status(400).json({
                success: false,
                error: 'Name and Type are required'
            });
        }

        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                error: 'File or URL is required'
            });
        }

        const document = await documentsService.createDocument({
            patientId,
            uploadedBy: patientId,
            name: req.body.name,
            type: req.body.type,
            fileUrl: fileUrl,
            fileSize: req.file ? req.file.size : undefined,
            mimeType: req.file ? req.file.mimetype : undefined,
            recordId: req.body.recordId,
        });
        return res.status(201).json({ success: true, data: document });
    } catch (error) {
        return next(error);
    }
});

// Get single document
router.get('/me/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const document = await documentsService.getDocumentById(req.params.id, patientId);
        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        return res.json({ success: true, data: document });
    } catch (error) {
        return next(error);
    }
});

// Delete document
router.delete('/me/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await documentsService.deleteDocument(req.params.id, patientId);
        return res.json({ success: true, message: 'Document deleted' });
    } catch (error: any) {
        if (error.message === 'Document not found') {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        return next(error);
    }
});

// Generate share link
router.post('/me/documents/:id/share', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const expiryHours = req.body.expiryHours || 24;

        const document = await documentsService.generateShareLink(req.params.id, patientId, expiryHours);
        return res.json({ success: true, data: document });
    } catch (error: any) {
        if (error.message === 'Document not found') {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        return next(error);
    }
});

// Revoke share link
router.delete('/me/documents/:id/share', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        await documentsService.revokeShareLink(req.params.id, patientId);
        return res.json({ success: true, message: 'Share link revoked' });
    } catch (error: any) {
        if (error.message === 'Document not found') {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        return next(error);
    }
});

// Access shared document (public route - no auth)
router.get('/shared/:token', async (req: Request, res: Response) => {
    try {
        const document = await documentsService.getSharedDocument(req.params.token);
        return res.json({ success: true, data: document });
    } catch (error: any) {
        return res.status(404).json({ success: false, error: error.message });
    }
});

// ============================================
// PRESCRIPTIONS
// ============================================

// Get patient's prescriptions
router.get('/me/prescriptions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = await getPatientId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const prescriptions = await prescriptionsService.getPatientPrescriptions(patientId, {
            limit,
            offset,
        });
        return res.json({ success: true, data: prescriptions });
    } catch (error) {
        return next(error);
    }
});

// Get single prescription
router.get('/me/prescriptions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prescription = await prescriptionsService.getPrescriptionById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found' });
        }

        // Verify patient owns this prescription
        const patientId = await getPatientId(req);
        if (prescription.patientId !== patientId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        return res.json({ success: true, data: prescription });
    } catch (error) {
        return next(error);
    }
});

// Download prescription PDF
router.get('/me/prescriptions/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prescription = await prescriptionsService.getPrescriptionById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found' });
        }

        const patientId = await getPatientId(req);
        if (prescription.patientId !== patientId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${req.params.id}.pdf`);

        const template = await templateService.getApplicableTemplate(prescription.doctorId);
        await PDFService.generatePrescriptionPDF(prescription, res, template);
    } catch (error) {
        return next(error);
    }
});

export default router;


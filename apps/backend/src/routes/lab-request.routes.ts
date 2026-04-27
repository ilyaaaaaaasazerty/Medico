import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as labRequestService from '../services/lab-request.service.js';
import { getPatientId } from '../services/patient.service.js';
import { storage as upload } from '../lib/storage.js';
import * as templateService from '../services/template.service.js';
import { PDFService } from '../services/pdf.service.js';

// Multer S3 Middleware imported as 'upload'

const router = Router();
router.use(authenticate);

/**
 * Book lab request
 * POST /api/lab-requests
 */
router.post('/', authorize('PATIENT'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { labCenterId, testIds, scheduledDate, scheduledTime, prescriptionUrl, notes } = req.body;

    if (!labCenterId || !testIds || !testIds.length || !scheduledDate || !scheduledTime) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const patientId = await getPatientId(req.user!.id);

    try {
        const request = await labRequestService.bookLabRequest({
            patientId,
            labCenterId,
            testIds,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            prescriptionUrl,
            notes,
        });
        return res.status(201).json({ success: true, data: request });
    } catch (error: any) {
        const errorMap: Record<string, { status: number; message: string }> = {
            LAB_NOT_AVAILABLE: { status: 400, message: 'Lab center is not available' },
            INVALID_TESTS: { status: 400, message: 'One or more tests are invalid' },
            INSUFFICIENT_CREDITS: { status: 400, message: 'Insufficient credits' },
            SLOT_FULL: { status: 400, message: 'Selected time slot is full' },
        };
        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.status).json({ success: false, error: mapped.message });
        } else {
            throw error;
        }
    }
}));

/**
 * Get lab request details
 * GET /api/lab-requests/:id
 */
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await labRequestService.getLabRequest(req.params.id);
    res.json({ success: true, data: request });
}));

/**
 * Cancel lab request
 * PUT /api/lab-requests/:id/cancel
 */
router.put('/:id/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const cancelledBy = req.user!.role === 'PATIENT' ? 'PATIENT' : 'LAB';
    const result = await labRequestService.cancelLabRequest(req.params.id, cancelledBy);
    res.json({ success: true, data: result });
}));

/**
 * Confirm lab request (Lab only)
 * PUT /api/lab-requests/:id/confirm
 */
router.put('/:id/confirm', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await labRequestService.confirmLabRequest(req.params.id);
    res.json({ success: true, data: request });
}));

/**
 * Mark sample collected (Lab only)
 * PUT /api/lab-requests/:id/collect
 */
router.put('/:id/collect', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { technicianId } = req.body;
    if (!technicianId) {
        return res.status(400).json({ success: false, error: 'Technician ID is required' });
    }
    const request = await labRequestService.collectSample(req.params.id, technicianId);
    return res.json({ success: true, data: request });
}));

/**
 * Start processing (Lab only)
 * PUT /api/lab-requests/:id/start
 */
router.put('/:id/start', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await labRequestService.startProcessing(req.params.id);
    res.json({ success: true, data: request });
}));

/**
 * Complete lab request (Lab only)
 * PUT /api/lab-requests/:id/complete
 */
router.put('/:id/complete', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await labRequestService.completeLabRequest(req.params.id);
    res.json({ success: true, data: request });
}));

/**
 * Upload result (Lab only)
 * POST /api/lab-requests/:id/results
 */
router.post('/:id/results', authorize('LAB_ADMIN'), upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fileName, notes } = req.body;
    let fileUrl = req.body.fileUrl;

    if (req.file) {
        const { getFileUrl } = await import('../lib/storage.js');
        fileUrl = getFileUrl(req.file.filename);
    }

    if (!fileUrl || !fileName) {
        return res.status(400).json({ success: false, error: 'File/URL and name are required' });
    }

    const result = await labRequestService.uploadResult(
        req.params.id,
        fileUrl,
        fileName,
        req.user!.id,
        notes
    );
    return res.status(201).json({ success: true, data: result });
}));

/**
 * Get results for a request
 * GET /api/lab-requests/:id/results
 */
router.get('/:id/results', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const results = await labRequestService.getResults(req.params.id);
    res.json({ success: true, data: results });
}));

/**
 * Download Lab Report PDF
 * GET /api/lab-requests/:id/report
 */
router.get('/:id/report', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await labRequestService.getLabRequest(req.params.id);

    if (!request) {
        return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Verify access (Patient, Lab Admin, or Prescribing Doctor?)
    // Basic check: Patient who owns it or Lab Admin of the center
    const isPatient = req.user!.role === 'PATIENT' && request.patientId === (await getPatientId(req.user!.id));
    const isLabAdmin = req.user!.role === 'LAB_ADMIN'; // Ideally check labCenterId too

    if (!isPatient && !isLabAdmin) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lab-report-${req.params.id}.pdf`);

    const template = await templateService.getLabTemplate(request.labCenterId);
    return PDFService.generateLabReportPDF(request, res, template as any);
}));

/**
 * Delete result (Lab only)
 * DELETE /api/lab-requests/:id/results/:resultId
 */
router.delete('/:id/results/:resultId', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    await labRequestService.deleteResult(req.params.resultId);
    res.json({ success: true, message: 'Result deleted' });
}));

/**
 * Get patient's lab requests
 * GET /api/lab-requests/patient/me
 */
router.get('/patient/me', authenticate, authorize('PATIENT'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const patientId = await getPatientId(req.user!.id);
    const requests = await labRequestService.getPatientLabRequests(patientId);
    res.json({ success: true, data: requests });
}));

/**
 * Get lab's requests (Lab admin only)
 * GET /api/lab-requests/lab/me
 */
router.get('/lab/me', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get lab admin's lab center
    const labAdmin = await import('../lib/prisma.js').then(m => m.prisma.labAdmin.findUnique({
        where: { userId: req.user!.id },
    }));

    if (!labAdmin) {
        return res.status(404).json({ success: false, error: 'Lab admin not found' });
    }

    const status = req.query.status as string | undefined;
    const requests = await labRequestService.getLabRequests(labAdmin.labCenterId, status as any);
    return res.json({ success: true, data: requests });
}));

/**
 * Get today's queue (Lab admin only)
 * GET /api/lab-requests/lab/today
 */
router.get('/lab/today', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const labAdmin = await import('../lib/prisma.js').then(m => m.prisma.labAdmin.findUnique({
        where: { userId: req.user!.id },
    }));

    if (!labAdmin) {
        return res.status(404).json({ success: false, error: 'Lab admin not found' });
    }

    const queue = await labRequestService.getLabTodayQueue(labAdmin.labCenterId);
    return res.json({ success: true, data: queue });
}));

/**
 * Get lab analytics (Lab admin only)
 * GET /api/lab-requests/lab/analytics
 */
router.get('/lab/analytics', authenticate, authorize('LAB_ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const labAdmin = await import('../lib/prisma.js').then(m => m.prisma.labAdmin.findUnique({
        where: { userId: req.user!.id },
    }));

    if (!labAdmin) {
        return res.status(404).json({ success: false, error: 'Lab admin not found' });
    }

    const analytics = await labRequestService.getLabAnalytics(labAdmin.labCenterId);
    return res.json({ success: true, data: analytics });
}));

export default router;

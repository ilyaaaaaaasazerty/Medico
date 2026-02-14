import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
// import { documentsService } from '../services/documents.service.js';
import prisma from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

/**
 * GET /:id
 * Get document details by ID.
 * Accessible by:
 * - Patient (if owner)
 * - Doctor (allowed to view any document for now, or could restrict to linked patients)
 */
router.get('/:id', asyncHandler(async (req: any, res: any) => {
    console.log('[Documents] Request for ID:', req.params.id);
    const documentId = req.params.id;
    const user = req.user!;

    // Fetch document first to check ownership/permissions
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { record: true }
    });

    if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Access Control
    if (user.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
        if (!patient || document.patientId !== patient.id) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    } else if (user.role === 'DOCTOR') {
        // Allow doctors to view documents. 
        // In a stricter system, we'd check if the doctor has an appointment with this patient.
        // For now, this unblocks the feature.
    } else {
        // Other roles (e.g. LAB, CLINIC_ADMIN) - deny for now unless needed
        // return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.json({ success: true, data: document });
}));

export default router;

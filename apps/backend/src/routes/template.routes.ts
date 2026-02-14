import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as templateService from '../services/template.service.js';
import { storage as upload, getFileUrl } from '../lib/storage.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validate uploaded image file (security check)
 */
function validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return { valid: false, error: 'File type not allowed. Use JPG, PNG, or WebP.' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large. Max size is 2MB.' };
    }

    // Additional: Check magic bytes for real file type (basic check)
    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    try {
        const buffer = Buffer.alloc(8);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 8, 0);
        fs.closeSync(fd);

        // Check for common image magic bytes
        const jpegMagic = buffer.slice(0, 2).toString('hex') === 'ffd8';
        const pngMagic = buffer.slice(0, 4).toString('hex') === '89504e47';
        const webpMagic = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
            buffer.slice(8, 12).toString('ascii') === 'WEBP';

        if (!jpegMagic && !pngMagic && !webpMagic) {
            // Delete the suspicious file
            fs.unlinkSync(filePath);
            return { valid: false, error: 'Invalid image file.' };
        }
    } catch {
        return { valid: false, error: 'Could not validate file.' };
    }

    return { valid: true };
}

/**
 * GET /templates/prescription
 * Get current template for the authenticated owner
 */
router.get('/prescription', asyncHandler(async (req: AuthRequest, res: Response) => {
    const owner = await templateService.getTemplateOwner(req.user!.id, req.user!.role);

    if (!owner) {
        // For clinic-affiliated doctors, get their clinic's template
        if (req.user!.role === 'DOCTOR') {
            const { prisma } = await import('../lib/prisma.js');
            const doctor = await prisma.doctor.findUnique({
                where: { userId: req.user!.id },
                select: { id: true, clinicAffiliations: { where: { status: 'ACTIVE' }, select: { clinicId: true } } },
            });

            if (doctor?.clinicAffiliations[0]) {
                const clinicTemplate = await templateService.getTemplate({
                    type: 'clinic',
                    clinicId: doctor.clinicAffiliations[0].clinicId
                });
                return res.json({
                    success: true,
                    data: clinicTemplate,
                    isClinicTemplate: true,
                    message: 'Using clinic template. Contact clinic admin to modify.'
                });
            }
        }
        return res.status(403).json({ success: false, error: 'Template management not available for your role' });
    }

    const template = await templateService.getTemplate(owner);
    return res.json({ success: true, data: template });
}));

/**
 * PUT /templates/prescription
 * Update template settings
 */
router.put('/prescription', asyncHandler(async (req: AuthRequest, res: Response) => {
    const owner = await templateService.getTemplateOwner(req.user!.id, req.user!.role);

    if (!owner) {
        return res.status(403).json({ success: false, error: 'You cannot modify templates' });
    }

    // Sanitize text inputs (basic XSS prevention)
    const allowedFields = [
        'headerTitle', 'headerSubtitle', 'headerAddress', 'headerPhone',
        'headerColor', 'footerText', 'primaryColor', 'secondaryColor',
        'showRxSymbol', 'showDiagnosis', 'showPatientId', 'showQrCode', 'showWatermark'
    ];

    const sanitizedData: Record<string, any> = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const value = req.body[field];
            // Sanitize strings
            if (typeof value === 'string') {
                sanitizedData[field] = value
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .substring(0, 500); // Max length
            } else if (typeof value === 'boolean') {
                sanitizedData[field] = value;
            }
        }
    }

    const template = await templateService.upsertTemplate(owner, sanitizedData as any);
    return res.json({ success: true, data: template });
}));

/**
 * POST /templates/prescription/logo
 * Upload logo image
 */
router.post('/prescription/logo', upload.single('logo'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const owner = await templateService.getTemplateOwner(req.user!.id, req.user!.role);

    if (!owner) {
        return res.status(403).json({ success: false, error: 'You cannot modify templates' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const validation = validateImageFile(req.file);
    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    const logoUrl = getFileUrl(req.file.filename);
    const template = await templateService.updateLogo(owner, logoUrl);
    return res.json({ success: true, data: template });
}));

/**
 * POST /templates/prescription/signature
 * Upload signature/stamp image
 */
router.post('/prescription/signature', upload.single('signature'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const owner = await templateService.getTemplateOwner(req.user!.id, req.user!.role);

    if (!owner) {
        return res.status(403).json({ success: false, error: 'You cannot modify templates' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const validation = validateImageFile(req.file);
    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    const signatureUrl = getFileUrl(req.file.filename);
    const template = await templateService.updateSignature(owner, signatureUrl);
    return res.json({ success: true, data: template });
}));

/**
 * DELETE /templates/prescription
 * Reset template to defaults
 */
router.delete('/prescription', asyncHandler(async (req: AuthRequest, res: Response) => {
    const owner = await templateService.getTemplateOwner(req.user!.id, req.user!.role);

    if (!owner) {
        return res.status(403).json({ success: false, error: 'You cannot modify templates' });
    }

    await templateService.deleteTemplate(owner);
    return res.json({ success: true, message: 'Template reset to defaults' });
}));

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/admin.js';
import { adminService } from '../services/admin.service.js';
import { supportService } from '../services/support.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

import { Request, Response } from 'express';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(requireSuperAdmin);

// Stats
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
}));

// Verifications
router.get('/verifications', asyncHandler(async (_req: Request, res: Response) => {
    const requests = await adminService.getPendingVerifications();
    res.json({ success: true, data: requests });
}));

router.put('/verifications/:id', asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const adminId = (req as any).user.id;
    const result = await adminService.verifyProvider(req.params.id, status, notes, adminId);
    res.json({ success: true, data: result });
}));

// Provider Management
router.post('/providers', asyncHandler(async (req: Request, res: Response) => {
    // Basic validation
    const { type, email, password, details } = req.body;
    if (!type || !email || !password || !details) {
        throw new Error('Missing required fields');
    }
    const result = await adminService.createProvider(req.body);
    res.json({ success: true, data: result });
}));

// Payouts
router.get('/payouts', asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const payouts = await adminService.getPayouts(status);
    res.json({ success: true, data: payouts });
}));

// User Management
router.get('/patients', asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const patients = await adminService.listPatients(search as string, status as string);
    res.json({ success: true, data: patients });
}));

router.get('/doctors', asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const doctors = await adminService.listDoctors(search as string, status as any);
    res.json({ success: true, data: doctors });
}));

router.get('/clinics', asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const clinics = await adminService.listClinics(search as string, status as any);
    res.json({ success: true, data: clinics });
}));

router.get('/labs', asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const labs = await adminService.listLabs(search as string, status as any);
    res.json({ success: true, data: labs });
}));

router.put('/users/:id/status', asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const result = await adminService.toggleUserStatus(req.params.id, status);
    res.json({ success: true, data: result });
}));

// Transport Providers
router.get('/transport-providers', asyncHandler(async (_req: Request, res: Response) => {
    const providers = await adminService.listTransportProviders();
    res.json({ success: true, data: providers });
}));

router.get('/feature-flags', asyncHandler(async (_req: Request, res: Response) => {
    const flags = await adminService.getFeatureFlags();
    res.json({ success: true, data: flags });
}));

router.put('/feature-flags/:key', asyncHandler(async (req: Request, res: Response) => {
    const { enabled } = req.body;
    const result = await adminService.updateFeatureFlag(req.params.key, enabled);
    res.json({ success: true, data: result });
}));

// Support Tickets
router.get('/tickets', asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const tickets = await supportService.listTickets(status as any);
    res.json({ success: true, data: tickets });
}));

router.get('/tickets/:id', asyncHandler(async (req: Request, res: Response) => {
    const ticket = await supportService.getTicket(req.params.id);
    res.json({ success: true, data: ticket });
}));

router.post('/tickets/:id/replies', asyncHandler(async (req: Request, res: Response) => {
    const adminId = (req as any).user.id;
    const { content } = req.body;
    const reply = await supportService.replyToTicket(req.params.id, adminId, content, true);
    res.json({ success: true, data: reply });
}));

export default router;

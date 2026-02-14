import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as clinicalOrderService from '../services/clinical-order.service.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createOrderSchema = z.object({
    appointmentId: z.string().uuid(),
    recordId: z.string().uuid().optional(),
    type: z.enum(['LAB', 'IMAGING', 'PROCEDURE', 'REFERRAL']),
    description: z.string().min(1),
    metadata: z.any().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['PENDING', 'ORDERED', 'COMPLETED', 'CANCELLED']),
});

/**
 * POST /
 * Create a clinical order
 */
router.post('/', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const data = createOrderSchema.parse(req.body);
    const order = await clinicalOrderService.createOrder(data);
    res.status(201).json({ success: true, data: order });
}));

/**
 * GET /appointment/:appointmentId
 * Get orders for an appointment
 */
router.get('/appointment/:appointmentId', asyncHandler(async (req: any, res: any) => {
    const orders = await clinicalOrderService.getAppointmentOrders(req.params.appointmentId);
    res.json({ success: true, data: orders });
}));

/**
 * PUT /:id/status
 * Update order status
 */
router.put('/:id/status', authorize('DOCTOR'), asyncHandler(async (req: any, res: any) => {
    const { status } = updateStatusSchema.parse(req.body);
    const order = await clinicalOrderService.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: order });
}));

export default router;

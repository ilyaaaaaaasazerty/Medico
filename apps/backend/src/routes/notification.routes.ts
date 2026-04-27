import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { notificationService } from '../services/notification.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: any, res: Response) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user!.id);
        return res.json({ success: true, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

router.put('/:id/read', async (req: any, res: Response) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user!.id);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
});

router.put('/read-all', async (req: any, res: Response) => {
    try {
        await notificationService.markAllAsRead(req.user!.id);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
});

// PUT /notifications/push-token — Register device push token
router.put('/push-token', async (req: any, res: Response) => {
    try {
        const schema = z.object({ token: z.string().min(1) });
        const { token } = schema.parse(req.body);

        await prisma.user.update({
            where: { id: req.user!.id },
            data: { expoPushToken: token },
        });
        return res.json({ success: true });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
    }
});

// DELETE /notifications/push-token — Unregister on logout
router.delete('/push-token', async (req: any, res: Response) => {
    try {
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { expoPushToken: null },
        });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
});

export default router;

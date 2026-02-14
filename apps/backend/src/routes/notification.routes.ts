import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { notificationService } from '../services/notification.service.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const notifications = await notificationService.getUserNotifications(userId);
        return res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error getting notifications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

router.put('/:id/read', async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        await notificationService.markAsRead(req.params.id, userId);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
});

router.put('/read-all', async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        await notificationService.markAllAsRead(userId);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
});

export default router;


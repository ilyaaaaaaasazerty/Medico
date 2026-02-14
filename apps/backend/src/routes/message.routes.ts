import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { messageService } from '../services/message.service.js';

const router = Router();

// Authenticate all routes
router.use(authenticate);

// Validation
const sendMessageSchema = z.object({
    content: z.string().min(1),
    attachments: z.any().optional()
});

const startThreadSchema = z.object({
    recipientUserId: z.string().uuid()
});

// GET /threads - List threads
router.get('/threads', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user!.id;
        const threads = await messageService.getMessageThreads(userId);
        res.json({ success: true, data: threads });
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch threads' });
    }
});

// GET /threads/:id - Get messages
router.get('/threads/:id', async (req: Request, res: Response) => {
    try {
        const threadId = req.params.id;
        // Ideally should check if user is part of the thread
        const messages = await messageService.getThreadMessages(threadId);
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// POST /threads - Start or get thread with a user
router.post('/threads', async (req: Request, res: Response) => {
    try {
        const body = startThreadSchema.parse(req.body);
        const userId = (req as any).user!.id;
        const recipientId = body.recipientUserId;

        if (userId === recipientId) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }

        const thread = await messageService.getOrCreateThread([userId, recipientId]);
        return res.json({ success: true, data: thread });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED_MESSAGING') {
            return res.status(403).json({ success: false, message: 'Messaging not allowed: No professional nexus found' });
        }
        if (error.message === 'INVALID_USER_ID') {
            return res.status(400).json({ success: false, message: 'Invalid recipient ID' });
        }

        console.error('Error starting thread:', error);
        return res.status(500).json({ success: false, message: 'Failed to start thread' });
    }
});

// POST /threads/:id - Send message
router.post('/threads/:id', async (req: Request, res: Response) => {
    try {
        const threadId = req.params.id;
        const body = sendMessageSchema.parse(req.body);
        const userId = (req as any).user!.id;

        const message = await messageService.sendMessage(
            threadId,
            userId,
            body.content,
            body.attachments
        );

        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

router.put('/:id/read', async (req: Request, res: Response) => {
    try {
        await messageService.markMessageRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;

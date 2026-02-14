import { prisma } from '../lib/prisma';
import { pushService } from './push.service';

export const notificationService = {
    getUserNotifications: async (userId: string) => {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    },

    markAsRead: async (notificationId: string, userId: string) => {
        return prisma.notification.update({
            where: { id: notificationId, userId },
            data: { isRead: true }
        });
    },

    markAllAsRead: async (userId: string) => {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    },

    createNotification: async (
        userId: string,
        type: string,
        title: string,
        message: string,
        data?: any
    ) => {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: data || {},
                isRead: false
            }
        });

        // Fire and forget push notification
        pushService.sendPushNotification(userId, title, message, data);

        return notification;
    }
};

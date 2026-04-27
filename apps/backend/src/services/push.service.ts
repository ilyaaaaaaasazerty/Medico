import { prisma } from '../lib/prisma.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<void> {
    const message = { to: token, title, body, data: data ?? {}, sound: 'default' };
    const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(message),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Expo push failed (${res.status}): ${text}`);
    }
}

export const pushService = {
    sendPushNotification: async (
        userId: string,
        title: string,
        body: string,
        data?: Record<string, unknown>
    ) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { expoPushToken: true },
            });
            if (!user?.expoPushToken) return;
            if (!user.expoPushToken.startsWith('ExponentPushToken[')) return;
            await sendExpoPush(user.expoPushToken, title, body, data);
        } catch (err) {
            console.error('[PushService] Failed to send push notification:', err);
        }
    },

    sendToMany: async (
        userIds: string[],
        title: string,
        body: string,
        data?: Record<string, unknown>
    ) => {
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { expoPushToken: true },
        });
        const tokens = users
            .map((u) => u.expoPushToken)
            .filter((t): t is string => !!t && t.startsWith('ExponentPushToken['));
        if (tokens.length === 0) return;
        const messages = tokens.map((token) => ({
            to: token,
            title,
            body,
            data: data ?? {},
            sound: 'default',
        }));
        const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(messages),
        });
        if (!res.ok) {
            const text = await res.text();
            console.error(`[PushService] Batch push failed (${res.status}): ${text}`);
        }
    },
};

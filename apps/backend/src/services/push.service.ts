export const pushService = {
    sendPushNotification: async (userId: string, title: string, body: string, data?: any) => {
        console.log(`[PushService] Sending Push to User ${userId}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        if (data) {
            console.log(`Data: ${JSON.stringify(data)}`);
        }
        // Mock implementation - simply return true
        return true;
    }
};

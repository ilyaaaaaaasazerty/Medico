import { api } from './api';

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getNotifications: async () => {
        const response = await api.get<{ success: true; data: Notification[] }>('/notifications');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.put<{ success: true }>(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.put<{ success: true }>('/notifications/read-all');
        return response.data;
    }
};

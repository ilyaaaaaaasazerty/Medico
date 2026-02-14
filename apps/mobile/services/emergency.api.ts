import { api } from './api';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

interface EmergencyBroadcastResult {
    affectedCount: number;
    message: string;
}

interface ScheduleDelayResult {
    affectedCount: number;
    delayMinutes: number;
}

export const emergencyApi = {
    broadcastEmergency: async (data: {
        clinicId?: string;
        message: string;
        date: string; // YYYY-MM-DD
    }): Promise<ApiResponse<EmergencyBroadcastResult>> => {
        const response = await api.post<ApiResponse<EmergencyBroadcastResult>>('/emergency/broadcast', data);
        return response.data;
    },

    delaySchedule: async (data: {
        clinicId?: string;
        delayMinutes: number;
        date: string; // YYYY-MM-DD
        reason?: string;
    }): Promise<ApiResponse<ScheduleDelayResult>> => {
        const response = await api.post<ApiResponse<ScheduleDelayResult>>('/emergency/delay', data);
        return response.data;
    },
};

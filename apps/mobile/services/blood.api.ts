import { api } from './api';

export interface BloodRequest {
    id: string;
    bloodType: string;
    urgency: 'EMERGENCY' | 'HIGH' | 'STABLE';
    location: string;
    unitsRequired: number;
    notes?: string;
    createdAt: string;
    patientName: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const bloodApi = {
    /**
     * Create a new blood request
     */
    createRequest: async (data: {
        bloodType: string;
        urgency: string;
        location: string;
        unitsRequired: number;
        notes?: string;
    }): Promise<ApiResponse<BloodRequest>> => {
        const response = await api.post<ApiResponse<BloodRequest>>('/blood-donation/requests', data);
        return response.data;
    },

    /**
     * Get recommended requests for the donor
     */
    getRecommendedRequests: async (): Promise<ApiResponse<BloodRequest[]>> => {
        const response = await api.get<ApiResponse<BloodRequest[]>>('/blood-donation/recommended');
        return response.data;
    },

    /**
     * Respond to a blood request
     */
    respondToRequest: async (requestId: string, notes?: string): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/blood-donation/requests/${requestId}/respond`, { notes });
        return response.data;
    },

    /**
     * Toggle donor status
     */
    updateDonorStatus: async (isDonor: boolean): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>('/patients/me', { isDonor });
        return response.data;
    }
};

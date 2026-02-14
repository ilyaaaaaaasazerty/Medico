import { api } from './api';

export interface DashboardStats {
    users: { patients: number; doctors: number; clinics: number; labs: number };
    tasks: { pendingVerifications: number };
    finance: { totalPayouts: number };
}

export interface VerificationRequest {
    id: string;
    type: 'DOCTOR' | 'CLINIC' | 'LAB';
    targetId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    documents: string[];
    createdAt: string;
}

export const adminApi = {
    getStats: async () => {
        const response = await api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard');
        return response.data;
    },

    getVerifications: async () => {
        const response = await api.get<{ success: boolean; data: VerificationRequest[] }>('/admin/verifications');
        return response.data;
    },

    verifyProvider: async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
        const response = await api.put<{ success: boolean; data: any }>(`/admin/verifications/${id}`, { status, notes });
        return response.data;
    }
};

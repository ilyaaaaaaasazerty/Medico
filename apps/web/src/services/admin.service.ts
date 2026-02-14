import api from './api';

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
    documents: string[]; // URLs
    createdAt: string;
}

export const adminService = {
    login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { identifier: email, password });
        return res.data;
    },

    getStats: async () => {
        const res = await api.get<{ data: DashboardStats }>('/admin/dashboard');
        return res.data.data;
    },

    getVerifications: async () => {
        const res = await api.get<{ data: VerificationRequest[] }>('/admin/verifications');
        return res.data.data;
    },

    getDoctors: async (search?: string) => {
        const res = await api.get<{ data: any[] }>(`/admin/doctors?search=${search || ''}`);
        return res.data.data;
    },

    getClinics: async (search?: string) => {
        const res = await api.get<{ data: any[] }>(`/admin/clinics?search=${search || ''}`);
        return res.data.data;
    },

    getLabs: async (search?: string) => {
        const res = await api.get<{ data: any[] }>(`/admin/labs?search=${search || ''}`);
        return res.data.data;
    },

    verifyProvider: async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
        const res = await api.put(`/admin/verifications/${id}`, { status, notes });
        return res.data.data;
    },

    getPayouts: async () => {
        const res = await api.get('/admin/payouts');
        return res.data.data;
    },

    createProvider: async (data: any) => {
        const res = await api.post('/admin/providers', data);
        return res.data.data;
    }
};

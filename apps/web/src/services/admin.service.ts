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
    documents: string[];
    createdAt: string;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    user: { id: string; email: string; status: 'ACTIVE' | 'SUSPENDED'; lastLoginAt?: string };
}

export interface SupportTicket {
    id: string;
    subject: string;
    content: string;
    status: string;
    priority: string;
    createdAt: string;
    patient: { firstName: string; lastName: string; avatarUrl?: string };
    replies?: { id: string; content: string; isStaff: boolean; createdAt: string }[];
}

export interface FeatureFlag {
    id: string;
    key: string;
    enabled: boolean;
    description?: string;
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

    verifyProvider: async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
        const res = await api.put(`/admin/verifications/${id}`, { status, notes });
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

    getPayouts: async () => {
        const res = await api.get('/admin/payouts');
        return res.data.data;
    },

    createProvider: async (data: any) => {
        const res = await api.post('/admin/providers', data);
        return res.data.data;
    },

    // Patients
    getPatients: async (search?: string) => {
        const res = await api.get<{ success: boolean; data: Patient[] }>(`/admin/patients?search=${search || ''}`);
        return res.data.data;
    },

    setUserStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
        const res = await api.put(`/admin/users/${userId}/status`, { status });
        return res.data;
    },

    // Support tickets
    getTickets: async () => {
        const res = await api.get<{ success: boolean; data: SupportTicket[] }>('/admin/tickets');
        return res.data.data;
    },

    getTicket: async (id: string) => {
        const res = await api.get<{ success: boolean; data: SupportTicket }>(`/admin/tickets/${id}`);
        return res.data.data;
    },

    replyToTicket: async (id: string, content: string) => {
        const res = await api.post(`/admin/tickets/${id}/replies`, { content });
        return res.data;
    },

    // Feature flags
    getFeatureFlags: async () => {
        const res = await api.get<{ success: boolean; data: FeatureFlag[] }>('/admin/feature-flags');
        return res.data.data;
    },

    toggleFeatureFlag: async (key: string, enabled: boolean) => {
        const res = await api.put(`/admin/feature-flags/${key}`, { enabled });
        return res.data;
    },
};

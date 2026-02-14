import { api } from './api';

export interface LabProfile {
    id: string;
    name: string;
    type: 'LABORATORY' | 'DIAGNOSTIC_CENTER' | 'PATHOLOGY' | 'RADIOLOGY';
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    description?: string;
    logoUrl?: string;
    latitude?: number;
    longitude?: number;
    homeCollection: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface RegisterLabData {
    name: string;
    type: 'LABORATORY' | 'DIAGNOSTIC_CENTER' | 'PATHOLOGY' | 'RADIOLOGY';
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    homeCollection?: boolean;
}

export interface LabTest {
    id: string;
    name: string;
    code: string;
    category: string;
    price: number;
    turnaroundTime: number;
    requiresFasting?: boolean;
    description?: string;
    sampleType?: string;
}

export interface Technician {
    id: string;
    firstName: string;
    lastName: string;
    qualification: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
}

export interface Equipment {
    id: string;
    name: string;
    type: string;
    model?: string;
    manufacturer?: string;
    status: string;
    lastMaintenance?: string;
}


export interface LabWorkingHours {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const labApi = {
    // Profile
    checkProfileExists: async (): Promise<ApiResponse<{ exists: boolean }>> => {
        const response = await api.get<ApiResponse<{ exists: boolean }>>('/labs/exists');
        return response.data;
    },

    // Get public profile (Patient view)
    getPublicProfile: async (id: string): Promise<ApiResponse<LabProfile & { workingHours: LabWorkingHours[], tests: LabTest[] }>> => {
        const response = await api.get<ApiResponse<any>>(`/labs/${id}/public`);
        return response.data;
    },

    registerLab: async (data: RegisterLabData): Promise<ApiResponse<LabProfile>> => {
        const response = await api.post<ApiResponse<LabProfile>>('/labs', data);
        return response.data;
    },

    getProfile: async (): Promise<ApiResponse<LabProfile>> => {
        const response = await api.get<ApiResponse<LabProfile>>('/labs/me');
        return response.data;
    },

    updateProfile: async (data: Partial<RegisterLabData>): Promise<ApiResponse<LabProfile>> => {
        const response = await api.put<ApiResponse<LabProfile>>('/labs/me', data);
        return response.data;
    },

    getDashboard: async (): Promise<ApiResponse<{
        profile: { id: string; name: string; type: string; logoUrl?: string; verificationStatus: string; homeCollection: boolean };
        stats: { totalTests: number; totalTechnicians: number; totalEquipment: number; totalRequests: number };
    }>> => {
        const response = await api.get<ApiResponse<any>>('/labs/me/dashboard');
        return response.data;
    },

    // Tests
    getTests: async (): Promise<ApiResponse<LabTest[]>> => {
        const response = await api.get<ApiResponse<LabTest[]>>('/labs/me/tests');
        return response.data;
    },

    addTest: async (data: Omit<LabTest, 'id'>): Promise<ApiResponse<LabTest>> => {
        const response = await api.post<ApiResponse<LabTest>>('/labs/me/tests', data);
        return response.data;
    },

    updateTest: async (id: string, data: Partial<Omit<LabTest, 'id'>>): Promise<ApiResponse<LabTest>> => {
        const response = await api.put<ApiResponse<LabTest>>(`/labs/me/tests/${id}`, data);
        return response.data;
    },

    removeTest: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/labs/me/tests/${id}`);
        return response.data;
    },

    // Technicians
    getTechnicians: async (): Promise<ApiResponse<Technician[]>> => {
        const response = await api.get<ApiResponse<Technician[]>>('/labs/me/technicians');
        return response.data;
    },

    addTechnician: async (data: Omit<Technician, 'id'>): Promise<ApiResponse<Technician>> => {
        const response = await api.post<ApiResponse<Technician>>('/labs/me/technicians', data);
        return response.data;
    },

    updateTechnician: async (id: string, data: Partial<Omit<Technician, 'id'>>): Promise<ApiResponse<Technician>> => {
        const response = await api.put<ApiResponse<Technician>>(`/labs/me/technicians/${id}`, data);
        return response.data;
    },

    removeTechnician: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/labs/me/technicians/${id}`);
        return response.data;
    },

    // Equipment
    getEquipment: async (): Promise<ApiResponse<Equipment[]>> => {
        const response = await api.get<ApiResponse<Equipment[]>>('/labs/me/equipment');
        return response.data;
    },

    addEquipment: async (data: Omit<Equipment, 'id'>): Promise<ApiResponse<Equipment>> => {
        const response = await api.post<ApiResponse<Equipment>>('/labs/me/equipment', data);
        return response.data;
    },

    removeEquipment: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/labs/me/equipment/${id}`);
        return response.data;
    },

    // Working Hours
    getWorkingHours: async (): Promise<ApiResponse<LabWorkingHours[]>> => {
        const response = await api.get<ApiResponse<LabWorkingHours[]>>('/labs/me/hours');
        return response.data;
    },

    setWorkingHours: async (data: LabWorkingHours[]): Promise<ApiResponse<LabWorkingHours[]>> => {
        const response = await api.put<ApiResponse<LabWorkingHours[]>>('/labs/me/hours', data);
        return response.data;
    },

    // === LAB REQUEST METHODS (Phase 9) ===

    // Book lab request (Patient)
    bookLabRequest: async (data: {
        labCenterId: string;
        testIds: string[];
        scheduledDate: string;
        scheduledTime: string;
        prescriptionUrl?: string;
        notes?: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/lab-requests', data);
        return response.data;
    },

    // Get patient's lab requests
    getMyLabRequests: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/lab-requests/patient/me');
        return response.data;
    },

    // Get single lab request
    getLabRequest: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/lab-requests/${id}`);
        return response.data;
    },

    // Cancel lab request
    cancelLabRequest: async (id: string): Promise<ApiResponse<{ requestId: string; refundAmount: number }>> => {
        const response = await api.put<ApiResponse<any>>(`/lab-requests/${id}/cancel`);
        return response.data;
    },

    // Get results for a request
    getResults: async (requestId: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/lab-requests/${requestId}/results`);
        return response.data;
    },

    // Get lab's requests (Lab Admin)
    getLabRequests: async (status?: string): Promise<ApiResponse<any[]>> => {
        const query = status ? `?status=${status}` : '';
        const response = await api.get<ApiResponse<any[]>>(`/lab-requests/lab/me${query}`);
        return response.data;
    },

    // Get today's queue (Lab Admin)
    getTodayQueue: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/lab-requests/lab/today');
        return response.data;
    },

    // Get analytics (Lab Admin)
    getAnalytics: async (): Promise<ApiResponse<{
        totalRequests: number;
        completedRequests: number;
        todayRequests: number;
        completionRate: number;
    }>> => {
        const response = await api.get<ApiResponse<any>>('/lab-requests/lab/analytics');
        return response.data;
    },

    // Confirm request (Lab Admin)
    confirmRequest: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/lab-requests/${id}/confirm`);
        return response.data;
    },

    // Collect sample (Lab Admin)
    collectSample: async (id: string, technicianId?: string): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/lab-requests/${id}/collect`, { technicianId });
        return response.data;
    },

    // Start processing (Lab Admin)
    startProcessing: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/lab-requests/${id}/start`);
        return response.data;
    },

    // Complete request (Lab Admin)
    completeRequest: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/lab-requests/${id}/complete`);
        return response.data;
    },

    // Upload result (Lab Admin)
    uploadResult: async (requestId: string, file: { uri: string; name: string; type: string }, fileName: string, notes?: string): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        });
        formData.append('fileName', fileName);
        if (notes) formData.append('notes', notes);

        const token = api.getToken();
        const response = await fetch(`${api.getBaseUrl()}/lab-requests/${requestId}/results`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        const result = await response.json();
        return result;
    },

    // Delete result (Lab Admin)
    deleteResult: async (requestId: string, resultId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete<ApiResponse<any>>(`/lab-requests/${requestId}/results/${resultId}`);
        return response.data;
    },
};

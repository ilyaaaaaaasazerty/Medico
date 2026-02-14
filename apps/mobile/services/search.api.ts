import { api } from './api';

export interface DoctorSlot {
    time: string;
    available: boolean;
}

export interface SearchResult {
    doctors: any[];
    clinics: any[];
    labs: any[];
}

export interface ClinicProfile {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    description?: string;
    email?: string;
    website?: string;
    verificationStatus?: string;
    is24Hours?: boolean;
    services: any[];
    doctors: any[];
    workingHours: any[];
}

export interface LabProfile {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email?: string;
    website?: string;
    description?: string;
    verificationStatus?: string;
    homeCollection?: boolean;
    tests: any[];
    workingHours: any[];
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const searchApi = {
    search: async (query: string): Promise<ApiResponse<SearchResult>> => {
        const response = await api.get<ApiResponse<SearchResult>>(`/search?q=${query}`);
        return response.data;
    },

    searchDoctors: async (query: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any>>(`/search/doctors?name=${query}`);
        // Backend returns paginated { doctors: [], total: ... } but app expects array
        if (response.data.success && response.data.data?.doctors) {
            return { ...response.data, data: response.data.data.doctors };
        }
        return response.data;
    },

    searchClinics: async (query: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/search/clinics?q=${query}`);
        return response.data;
    },

    searchLabs: async (query: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/search/labs?q=${query}`);
        return response.data;
    },

    getClinicProfile: async (id: string): Promise<ApiResponse<ClinicProfile>> => {
        const response = await api.get<ApiResponse<ClinicProfile>>(`/clinics/${id}/public`);
        return response.data;
    },

    getLabProfile: async (id: string): Promise<ApiResponse<LabProfile>> => {
        const response = await api.get<ApiResponse<LabProfile>>(`/labs/${id}/public`);
        return response.data;
    },

    getDoctorSlots: async (doctorId: string, date: string): Promise<ApiResponse<DoctorSlot[]>> => {
        const response = await api.get<ApiResponse<DoctorSlot[]>>(`/doctors/${doctorId}/slots?date=${date}`);
        return response.data;
    },
};

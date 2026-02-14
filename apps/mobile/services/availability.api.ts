import { api } from './api';

interface Availability {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    clinicId?: string;
    clinic?: { id: string; name: string };
}

interface AvailabilityException {
    id: string;
    date: string;
    isBlocked: boolean;
    reason?: string;
    startTime?: string;
    endTime?: string;
}

interface Slot {
    time: string;
    available: boolean;
}

interface DoctorSearchResult {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    bio?: string;
    consultationFee?: number;
    averageRating?: number;
    totalReviews: number;
    verified?: boolean;
    specialties: Array<{ id: string; name: string }>;
    clinics: Array<{ id: string; name: string; city: string; address?: string }>;
}


export interface DoctorProfile extends DoctorSearchResult {
    title?: string;
    yearsExperience?: number;
    teleconsultEnabled: boolean;
    languages?: string[];
    education: Array<{ degree: string; institution: string; year: number }>;
    recentReviews: any[];
}


interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const availabilityApi = {
    // Doctor's own availability management
    getMyAvailability: async (clinicId?: string): Promise<ApiResponse<Availability[]>> => {
        const params = clinicId ? `?clinicId=${clinicId}` : '';
        const response = await api.get<ApiResponse<Availability[]>>(`/doctors/me/availability${params}`);
        return response.data;
    },

    setAvailability: async (data: Omit<Availability, 'id' | 'clinic'>): Promise<ApiResponse<Availability>> => {
        const response = await api.post<ApiResponse<Availability>>('/doctors/me/availability', data);
        return response.data;
    },

    updateAvailability: async (
        id: string,
        data: Partial<Omit<Availability, 'id' | 'clinic'>>
    ): Promise<ApiResponse<Availability>> => {
        const response = await api.put<ApiResponse<Availability>>(`/doctors/me/availability/${id}`, data);
        return response.data;
    },

    removeAvailability: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/availability/${id}`);
        return response.data;
    },

    // Exceptions
    getMyExceptions: async (fromDate?: string): Promise<ApiResponse<AvailabilityException[]>> => {
        const params = fromDate ? `?from=${fromDate}` : '';
        const response = await api.get<ApiResponse<AvailabilityException[]>>(`/doctors/me/exceptions${params}`);
        return response.data;
    },

    addException: async (data: Omit<AvailabilityException, 'id'>): Promise<ApiResponse<AvailabilityException>> => {
        const response = await api.post<ApiResponse<AvailabilityException>>('/doctors/me/exceptions', data);
        return response.data;
    },

    removeException: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/exceptions/${id}`);
        return response.data;
    },
};

export const searchApi = {
    // Public search
    searchDoctors: async (params?: {
        specialty?: string;
        city?: string;
        name?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<{ doctors: DoctorSearchResult[]; total: number; page: number; totalPages: number }>> => {
        const queryParams = new URLSearchParams();
        if (params?.specialty) queryParams.append('specialty', params.specialty);
        if (params?.city) queryParams.append('city', params.city);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await api.get<ApiResponse<any>>(`/search/doctors?${queryParams.toString()}`);
        return response.data;
    },

    getDoctorProfile: async (doctorId: string): Promise<ApiResponse<DoctorProfile>> => {
        const response = await api.get<ApiResponse<DoctorProfile>>(`/search/doctors/${doctorId}`);
        return response.data;
    },

    getDoctorSlots: async (
        doctorId: string,
        date: string,
        clinicId?: string
    ): Promise<ApiResponse<Slot[]>> => {
        const params = clinicId ? `?date=${date}&clinicId=${clinicId}` : `?date=${date}`;
        const response = await api.get<ApiResponse<Slot[]>>(`/search/doctors/${doctorId}/slots${params}`);
        return response.data;
    },
};

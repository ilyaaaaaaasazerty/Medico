import { api } from './api';

export interface ClinicServiceType {
    id: string;
    name: string;
    category: 'PRIMARY_CARE' | 'DIAGNOSTIC' | 'SPECIALIST' | 'THERAPEUTIC' | 'EMERGENCY';
    description?: string;
    duration: number;
    price: number;
    isActive: boolean;
}

export interface Room {
    id: string;
    name: string;
    type: string;
    floor?: string;
    isActive: boolean;
}

export interface WaitlistEntry {
    id: string;
    appointmentId: string;
    clinicId: string;
    queuePosition: number;
    checkedInAt: string;
    calledAt?: string;
    status: 'WAITING' | 'CALLED' | 'WITH_NURSE' | 'WITH_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
    appointment?: any;
}

export interface VitalRecording {
    id: string;
    appointmentId: string;
    recordedBy: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    notes?: string;
    recordedAt: string;
}

export interface RoomAssignment {
    id: string;
    roomId: string;
    appointmentId: string;
    assignedAt: string;
    releasedAt?: string;
    room?: any;
    appointment?: any;
}

export interface ClinicDashboardStats {
    appointmentsByStatus: Record<string, number>;
    queueLength: number;
    rooms: {
        total: number;
        occupied: number;
        available: number;
    };
    roomDetails: any[];
    activeDoctorsCount: number;
}

export interface ClinicRegistrationData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    description?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const clinicApi = {
    // ============================================
    // ============================================
    // LEGACY METHODS (Required for existing screens)
    // ============================================

    registerClinic: async (data: ClinicRegistrationData): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/clinics', data);
        return response.data;
    },

    // Profile
    getProfile: async (): Promise<ApiResponse> => {
        const response = await api.get<ApiResponse>('/clinics/me');
        return response.data;
    },


    checkProfileExists: async (): Promise<ApiResponse<{ exists: boolean }>> => {
        const response = await api.get<ApiResponse<{ exists: boolean }>>('/clinics/exists');
        return response.data;
    },

    updateProfile: async (data: Partial<ClinicRegistrationData>): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>('/clinics/me', data);
        return response.data;
    },

    // Doctors
    getAffiliatedDoctors: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/clinics/me/doctors');
        return response.data;
    },


    addDoctor: async (doctorId: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/clinics/me/doctors', { doctorId });
        return response.data;
    },


    removeDoctor: async (doctorId: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/clinics/me/doctors/${doctorId}`);
        return response.data;
    },


    // Staff
    getStaff: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/clinics/me/staff');
        return response.data;
    },


    getStaffMember: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/clinics/me/staff/${id}`);
        return response.data;
    },


    addStaff: async (data: any): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/clinics/me/staff', data);
        return response.data;
    },


    updateStaff: async (id: string, data: any): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/clinics/me/staff/${id}`, data);
        return response.data;
    },


    removeStaff: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/clinics/me/staff/${id}`);
        return response.data;
    },


    // Rooms (Configuration)
    getRooms: async (): Promise<ApiResponse<Room[]>> => {
        const response = await api.get<ApiResponse<Room[]>>('/clinics/me/rooms');
        return response.data;
    },

    addRoom: async (data: any): Promise<ApiResponse<Room>> => {
        const response = await api.post<ApiResponse<Room>>('/clinics/me/rooms', data);
        return response.data;
    },

    updateRoom: async (id: string, data: any): Promise<ApiResponse<Room>> => {
        const response = await api.put<ApiResponse<Room>>(`/clinics/me/rooms/${id}`, data);
        return response.data;
    },

    removeRoom: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/clinics/me/rooms/${id}`);
        return response.data;
    },

    // Working Hours
    getWorkingHours: async (): Promise<ApiResponse> => {
        const response = await api.get<ApiResponse>('/clinics/me/hours');
        return response.data;
    },

    setWorkingHours: async (data: any): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>('/clinics/me/hours', data);
        return response.data;
    },


    // Legacy Appointments
    getAppointments: async (params?: { status?: string; date?: string; doctorId?: string }): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/clinics/me/appointments', { params });
        return response.data;
    },


    // ============================================
    // NEW OPERATIONS METHODS (Phase 11.5)
    // ============================================

    // Services
    getServices: async (clinicId: string): Promise<ApiResponse<ClinicServiceType[]>> => {
        const response = await api.get<ApiResponse<ClinicServiceType[]>>(`/clinic-operations/${clinicId}/services`);
        return response.data;
    },


    getServicesByCategory: async (clinicId: string): Promise<ApiResponse<Record<string, ClinicServiceType[]>>> => {
        const response = await api.get<ApiResponse<Record<string, ClinicServiceType[]>>>(`/clinic-operations/${clinicId}/services/categories`);
        return response.data;
    },


    // Queue
    checkInPatient: async (appointmentId: string): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/clinic-operations/appointments/${appointmentId}/check-in`);
        return response.data;
    },


    getQueue: async (clinicId: string): Promise<ApiResponse<WaitlistEntry[]>> => {
        const response = await api.get<ApiResponse<WaitlistEntry[]>>(`/clinic-operations/${clinicId}/queue`);
        return response.data;
    },


    updateQueueStatus: async (waitlistId: string, status: string): Promise<ApiResponse<WaitlistEntry>> => {
        const response = await api.put<ApiResponse<WaitlistEntry>>(`/clinic-operations/queue/${waitlistId}/status`, { status });
        return response.data;
    },


    // Vitals
    recordVitals: async (appointmentId: string, recordedBy: string, vitals: Partial<VitalRecording>): Promise<ApiResponse<VitalRecording>> => {
        const response = await api.post<ApiResponse<VitalRecording>>(`/clinic-operations/appointments/${appointmentId}/vitals`, {
            recordedBy,
            ...vitals,
        });
        return response.data;
    },


    getVitals: async (appointmentId: string): Promise<ApiResponse<VitalRecording[]>> => {
        const response = await api.get<ApiResponse<VitalRecording[]>>(`/clinic-operations/appointments/${appointmentId}/vitals`);
        return response.data;
    },


    // Rooms (Status)
    getRoomAvailability: async (clinicId: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/clinic-operations/${clinicId}/rooms`);
        return response.data;
    },


    assignRoom: async (appointmentId: string, roomId: string): Promise<ApiResponse<RoomAssignment>> => {
        const response = await api.post<ApiResponse<RoomAssignment>>(`/clinic-operations/rooms/assign`, {
            appointmentId,
            roomId,
        });
        return response.data;
    },


    releaseRoom: async (assignmentId: string): Promise<ApiResponse<RoomAssignment>> => {
        const response = await api.post<ApiResponse<RoomAssignment>>(`/clinic-operations/rooms/release`, {
            assignmentId,
        });
        return response.data;
    },


    // Dashboard
    getDashboard: async (clinicId?: string): Promise<ApiResponse<ClinicDashboardStats | any>> => {
        // If clinicId provided, use new operations endpoint (stats focus)
        if (clinicId) {
            const response = await api.get<ApiResponse<ClinicDashboardStats>>(`/clinic-operations/${clinicId}/dashboard`);
            return response.data;
        }
        // Otherwise use legacy endpoint (profile focus)
        const response = await api.get<ApiResponse<any>>('/clinics/me/dashboard');
        return response.data;
    },


    findDoctor: async (query: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/find?q=${encodeURIComponent(query)}`);
        return response.data;
    },


    // Security
    requestPasswordChangeOtp: async (): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/change-password/request-otp');
        return response.data;
    },

    verifyPasswordChange: async (data: { code: string; password: any }): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/change-password/verify', data);
        return response.data;
    },


    // Emergency & Schedule Control
    toggleEmergency: async (active: boolean): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/clinics/me/emergency', { active });
        return response.data;
    },


    shiftSchedule: async (delayMinutes: number): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/clinics/me/setback', { delayMinutes });
        return response.data;
    },


    getPublicProfile: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/clinics/${id}/public`);
        return response.data;
    },

};

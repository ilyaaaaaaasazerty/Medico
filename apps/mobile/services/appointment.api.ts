import { api } from './api';

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    clinicId?: string;
    serviceId: string;
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CALLED' | 'CHECKED_IN';
    type: 'IN_PERSON' | 'VIDEO_CALL' | 'HOME_VISIT';
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    checkInTime?: string;

    cost?: number;
    doctor?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        specialties?: Array<{ specialty: { name: string } }>;
        title?: string;
    };
    clinic?: {
        name: string;
        city: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    };
    service?: {
        name: string;
    };
    patient?: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string | null;
    };
    medicalRecord?: {
        id: string;
        diagnosis?: string;
        chiefComplaint?: string;
        symptoms?: string;
        notes?: string;
        visitDate: string;
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        followUpDate?: string;
        followUpNotes?: string;
    };
    prescription?: {
        id: string;
        items: any[];
    };
    attachments?: Array<{
        id: string;
        name: string;
        fileUrl: string;
        uploadedAt: string;
    }>;
    clinicalOrders?: Array<{
        id: string;
        type: string;
        description: string;
        status: string;
    }>;
    reason?: string;
    notes?: string;
}

export interface CreateAppointmentInput {
    doctorId: string;
    clinicId?: string;
    serviceId: string;
    date: string;
    time: string;
    type: 'IN_PERSON' | 'VIDEO_CALL' | 'HOME_VISIT';
    reason?: string;
    notes?: string;
    paymentMethod: 'CASH' | 'ONLINE' | 'WALLET';
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const appointmentApi = {
    getServices: async (doctorId?: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/services', { params: { doctorId } });
        return response.data;
    },

    bookAppointment: async (data: CreateAppointmentInput): Promise<ApiResponse<Appointment>> => {
        const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
        return response.data;
    },

    uploadAttachment: async (appointmentId: string, formData: FormData): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/appointments/${appointmentId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getMyAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
        const response = await api.get<ApiResponse<Appointment[]>>('/appointments');
        return response.data;
    },

    getDoctorAppointments: async (params?: { date?: string; status?: string }): Promise<ApiResponse<Appointment[]>> => {
        const response = await api.get<ApiResponse<Appointment[]>>('/appointments/doctor/list', { params });
        return response.data;
    },

    updateStatus: async (id: string, status: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
        return response.data;
    },

    getAppointmentDetails: async (id: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
        return response.data;
    },

    cancelAppointment: async (id: string, reason?: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason });
        return response.data;
    },

    rescheduleAppointment: async (id: string, date: string, time: string, reason?: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { date, time, reason });
        return response.data;
    },

    callPatient: async (id: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/call`);
        return response.data;
    },

    finalizeVisit: async (id: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/finalize`);
        return response.data;
    },

    checkIn: async (id: string): Promise<ApiResponse<Appointment>> => {
        const response = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/check-in`);
        return response.data;
    },
};


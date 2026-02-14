import { api } from './api';

interface DoctorProfile {
    id: string;
    firstName: string;
    lastName: string;
    title?: string;
    licenseNumber: string;
    licenseExpiry: string;
    yearsExperience?: number;
    bio?: string;
    avatarUrl?: string;
    languages?: string[];
    consultationFee?: number;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verified?: boolean;
    emergencyMode: boolean;
    education?: Education[];
    specialties?: Specialty[];
}


interface CreateDoctorData {
    firstName: string;
    lastName: string;
    title?: string;
    licenseNumber: string;
    licenseExpiry: string;
    yearsExperience?: number;
    bio?: string;
    languages?: string[];
    consultationFee?: number;
}


interface Education {
    id: string;
    degree: string;
    institution: string;
    year: number;
}

interface DoctorDocument {
    id: string;
    type: string;
    url: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface Specialty {
    id: string;
    name: string;
    description?: string;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const doctorApi = {
    // Specialties (public)
    getAllSpecialties: async (): Promise<ApiResponse<Specialty[]>> => {
        const response = await api.get<ApiResponse<Specialty[]>>('/doctors/specialties');
        return response.data;
    },

    // Clinic Affiliations
    getClinicAffiliations: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/clinics');
        return response.data;
    },

    setPrimaryClinic: async (clinicId: string): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>(`/doctors/me/clinics/${clinicId}/primary`, {});
        return response.data;
    },

    leaveClinic: async (clinicId: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/clinics/${clinicId}`);
        return response.data;
    },

    // Profile
    checkProfileExists: async (): Promise<ApiResponse<{ exists: boolean }>> => {
        const response = await api.get<ApiResponse<{ exists: boolean }>>('/doctors/exists');
        return response.data;
    },

    createProfile: async (data: CreateDoctorData): Promise<ApiResponse<DoctorProfile>> => {
        const response = await api.post<ApiResponse<DoctorProfile>>('/doctors', data);
        return response.data;
    },

    getProfile: async (): Promise<ApiResponse<DoctorProfile>> => {
        const response = await api.get<ApiResponse<DoctorProfile>>('/doctors/me');
        return response.data;
    },

    updateProfile: async (data: Partial<CreateDoctorData>): Promise<ApiResponse<DoctorProfile>> => {
        const response = await api.put<ApiResponse<DoctorProfile>>('/doctors/me', data);
        return response.data;
    },

    getDashboard: async (): Promise<ApiResponse<{
        profile: { id: string; firstName: string; lastName: string; avatarUrl?: string; verificationStatus: string; isAvailable: boolean; emergencyMode: boolean };
        upcomingAppointments: any[];
        stats: { totalAppointments: number; totalReviews: number; totalEarnings: number };
    }>> => {
        const response = await api.get<ApiResponse<any>>('/doctors/me/dashboard');
        return response.data;
    },

    getAppointments: async (params?: { start?: string; end?: string; status?: string }): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/appointments', { params });
        return response.data;
    },

    getVerificationStatus: async (): Promise<ApiResponse<{ status: string; documents: any[] }>> => {
        const response = await api.get<ApiResponse<any>>('/doctors/me/verification');
        return response.data;
    },

    // Education
    getEducation: async (): Promise<ApiResponse<Education[]>> => {
        const response = await api.get<ApiResponse<Education[]>>('/doctors/me/education');
        return response.data;
    },

    addEducation: async (data: Omit<Education, 'id'>): Promise<ApiResponse<Education>> => {
        const response = await api.post<ApiResponse<Education>>('/doctors/me/education', data);
        return response.data;
    },

    updateEducation: async (id: string, data: Partial<Omit<Education, 'id'>>): Promise<ApiResponse<Education>> => {
        const response = await api.put<ApiResponse<Education>>(`/doctors/me/education/${id}`, data);
        return response.data;
    },

    deleteEducation: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/education/${id}`);
        return response.data;
    },

    removeEducation: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/education/${id}`);
        return response.data;
    },

    // Documents
    getDocuments: async (): Promise<ApiResponse<DoctorDocument[]>> => {
        const response = await api.get<ApiResponse<DoctorDocument[]>>('/doctors/me/documents');
        return response.data;
    },

    addDocument: async (data: { type: string; url: string; name: string }): Promise<ApiResponse<DoctorDocument>> => {
        const response = await api.post<ApiResponse<DoctorDocument>>('/doctors/me/documents', data);
        return response.data;
    },

    removeDocument: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/documents/${id}`);
        return response.data;
    },

    // Specialties
    getMySpecialties: async (): Promise<ApiResponse<{ specialty: Specialty; isPrimary: boolean }[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/specialties');
        return response.data;
    },

    getDoctorSpecialties: async (): Promise<ApiResponse<{ specialty: Specialty }[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/specialties');
        return response.data;
    },

    addSpecialty: async (specialtyId: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/doctors/me/specialties', { specialtyId });
        return response.data;
    },

    removeSpecialty: async (specialtyId: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/specialties/${specialtyId}`);
        return response.data;
    },

    setPrimarySpecialty: async (specialtyId: string): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>(`/doctors/me/specialties/${specialtyId}/primary`, {});
        return response.data;
    },

    getPrescriptionPDF: async (id: string): Promise<string> => {
        return `${api.getBaseUrl()}/doctors/prescriptions/${id}/pdf?token=${api.getToken()}`;
    },

    getRecordPDF: async (appointmentId: string): Promise<string> => {
        return `${api.getBaseUrl()}/doctors/appointments/${appointmentId}/record/pdf?token=${api.getToken()}`;
    },

    // Medical Records
    createRecord: async (appointmentId: string, data: {
        patientId: string;
        visitDate: string;
        chiefComplaint?: string;
        symptoms?: string;
        diagnosis?: string;
        notes?: string;
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        followUpDate?: string;
        followUpNotes?: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/doctors/appointments/${appointmentId}/record`, data);
        return response.data;
    },

    updateRecord: async (appointmentId: string, data: any): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>(`/doctors/appointments/${appointmentId}/record`, data);
        return response.data;
    },

    getPatientRecords: async (patientId: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/doctors/patients/${patientId}/records`);
        return response.data;
    },

    getPatientDocuments: async (patientId: string): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>(`/doctors/patients/${patientId}/documents`);
        return response.data;
    },

    getPatientHealthProfile: async (patientId: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/patients/${patientId}/health-profile`);
        return response.data;
    },

    getMedicalRecords: async (params?: { patientId?: string; limit?: number; offset?: number }): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/records', { params });
        return response.data;
    },

    getRecordById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/records/${id}`);
        return response.data;
    },

    getPrescriptionById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/prescriptions/${id}`);
        return response.data;
    },

    // Prescriptions
    createPrescription: async (appointmentId: string, data: {
        patientId: string;
        diagnosis?: string;
        instructions?: string;
        temporarySignature?: string;
        validUntil?: string;
        items: Array<{
            medication: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions?: string;
            quantity?: number;
        }>;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/doctors/appointments/${appointmentId}/prescription`, data);
        return response.data;
    },

    uploadPrescriptionSignature: async (uri: string): Promise<ApiResponse<{ signatureUrl: string }>> => {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'signature.png';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/png`;

        formData.append('signature', {
            uri,
            name: filename,
            type,
        } as any);

        const response = await api.post<ApiResponse<{ signatureUrl: string }>>('/doctors/prescriptions/signature', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getPrescription: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/prescriptions/${id}`);
        return response.data;
    },

    getMyPrescriptions: async (patientId?: string): Promise<ApiResponse<any[]>> => {
        const url = patientId
            ? `/doctors/me/prescriptions?patientId=${patientId}`
            : '/doctors/me/prescriptions';
        const response = await api.get<ApiResponse<any[]>>(url);
        return response.data;
    },

    // Prescription Templates
    getTemplates: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/templates');
        return response.data;
    },

    createTemplate: async (data: {
        name: string;
        diagnosis?: string;
        medications: any;
        instructions?: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/doctors/me/templates', data);
        return response.data;
    },

    getTemplateById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/doctors/me/templates/${id}`);
        return response.data;
    },

    updateTemplate: async (id: string, data: any): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>(`/doctors/me/templates/${id}`, data);
        return response.data;
    },

    deleteTemplate: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/templates/${id}`);
        return response.data;
    },

    // Emergency & Schedule Control
    toggleEmergency: async (active: boolean): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/doctors/me/emergency', { active });
        return response.data;
    },

    shiftSchedule: async (delayMinutes: number): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/doctors/me/setback', { delayMinutes });
        return response.data;
    },

    // Clinical Orders
    createClinicalOrder: async (appointmentId: string, data: {
        type: 'LAB' | 'IMAGING' | 'PROCEDURE' | 'REFERRAL';
        description?: string;
        metadata?: any;
        recordId?: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/appointments/${appointmentId}/orders`, data);
        return response.data;
    },

    // Availability Exceptions
    getAvailabilityExceptions: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/doctors/me/availability-exceptions');
        return response.data;
    },

    addAvailabilityException: async (data: any): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/doctors/me/availability-exceptions', data);
        return response.data;
    },

    removeAvailabilityException: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/doctors/me/availability-exceptions/${id}`);
        return response.data;
    },

};


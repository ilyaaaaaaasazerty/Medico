import { api } from './api';

interface PatientProfile {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string;
    avatarUrl?: string;
    bloodType?: string;
    height?: number;
    weight?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    emergencyName?: string;
    emergencyPhone?: string;
}

interface CreatePatientData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string;
    bloodType?: string;
    height?: number;
    weight?: number;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyName?: string;
    emergencyPhone?: string;
}

interface FamilyMember {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    relationship: string;
    bloodType?: string;
    height?: number;
    weight?: number;
}

interface Allergy {
    id: string;
    allergen: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    reaction?: string;
}


interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    status: 'ACTIVE' | 'COMPLETED';
    prescribedBy: string;
    startDate: string;
    endDate?: string;
}


interface Vaccination {
    id: string;
    name: string;
    dateGiven: string;
    provider?: string;
    nextDueDate?: string;
}

interface VitalSign {
    id: string;
    type: string;
    value: number;
    unit: string;
    recordedAt: string;
    notes?: string;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export const patientApi = {
    // Profile
    checkProfileExists: async (): Promise<ApiResponse<{ exists: boolean }>> => {
        const response = await api.get<ApiResponse<{ exists: boolean }>>('/patients/exists');
        return response.data;
    },

    createProfile: async (data: CreatePatientData): Promise<ApiResponse<PatientProfile>> => {
        const response = await api.post<ApiResponse<PatientProfile>>('/patients', data);
        return response.data;
    },

    getProfile: async (): Promise<ApiResponse<PatientProfile>> => {
        const response = await api.get<ApiResponse<PatientProfile>>('/patients/me');
        return response.data;
    },

    getPatientProfile: async (): Promise<ApiResponse<PatientProfile>> => {
        const response = await api.get<ApiResponse<PatientProfile>>('/patients/me');
        return response.data;
    },


    updateProfile: async (data: Partial<CreatePatientData>): Promise<ApiResponse<PatientProfile>> => {
        const response = await api.put<ApiResponse<PatientProfile>>('/patients/me', data);
        return response.data;
    },

    getDashboard: async (): Promise<ApiResponse<{
        profile: { id: string; firstName: string; lastName: string; avatarUrl?: string };
        upcomingAppointments: any[];
        activeMedications: Medication[];
        severeAllergies: Allergy[];
        recentVitals: VitalSign[];
    }>> => {
        const response = await api.get<ApiResponse<any>>('/patients/me/dashboard');
        return response.data;
    },

    // Family Members
    getFamilyMembers: async (): Promise<ApiResponse<FamilyMember[]>> => {
        const response = await api.get<ApiResponse<FamilyMember[]>>('/patients/me/family');
        return response.data;
    },

    getFamilyMember: async (id: string): Promise<ApiResponse<FamilyMember>> => {
        const response = await api.get<ApiResponse<FamilyMember>>(`/patients/me/family/${id}`);
        return response.data;
    },

    getFamilyTimeline: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/patients/me/family-timeline');
        return response.data;
    },


    addFamilyMember: async (data: Omit<FamilyMember, 'id'>): Promise<ApiResponse<FamilyMember>> => {
        const response = await api.post<ApiResponse<FamilyMember>>('/patients/me/family', data);
        return response.data;
    },

    updateFamilyMember: async (id: string, data: Partial<Omit<FamilyMember, 'id'>>): Promise<ApiResponse<FamilyMember>> => {
        const response = await api.put<ApiResponse<FamilyMember>>(`/patients/me/family/${id}`, data);
        return response.data;
    },

    deleteFamilyMember: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/family/${id}`);
        return response.data;
    },

    // Allergies
    getAllergies: async (): Promise<ApiResponse<Allergy[]>> => {
        const response = await api.get<ApiResponse<Allergy[]>>('/patients/me/allergies');
        return response.data;
    },

    addAllergy: async (data: Omit<Allergy, 'id'>): Promise<ApiResponse<Allergy>> => {
        const response = await api.post<ApiResponse<Allergy>>('/patients/me/allergies', data);
        return response.data;
    },

    updateAllergy: async (id: string, data: Partial<Omit<Allergy, 'id'>>): Promise<ApiResponse<Allergy>> => {
        const response = await api.put<ApiResponse<Allergy>>(`/patients/me/allergies/${id}`, data);
        return response.data;
    },

    deleteAllergy: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/allergies/${id}`);
        return response.data;
    },
    // Conditions
    getConditions: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/patients/me/conditions');
        return response.data;
    },

    addCondition: async (data: { name: string; diagnosedAt?: string; notes?: string }): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/patients/me/conditions', data);
        return response.data;
    },

    removeCondition: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/conditions/${id}`);
        return response.data;
    },

    // Medications
    getMedications: async (patientId?: string): Promise<ApiResponse<Medication[]>> => {
        const url = patientId ? `/patients/me/medications?patientId=${patientId}` : '/patients/me/medications';
        const response = await api.get<ApiResponse<Medication[]>>(url);
        return response.data;
    },


    addMedication: async (data: Omit<Medication, 'id'>): Promise<ApiResponse<Medication>> => {
        const response = await api.post<ApiResponse<Medication>>('/patients/me/medications', data);
        return response.data;
    },

    updateMedication: async (id: string, data: Partial<Omit<Medication, 'id'>>): Promise<ApiResponse<Medication>> => {
        const response = await api.put<ApiResponse<Medication>>(`/patients/me/medications/${id}`, data);
        return response.data;
    },

    deleteMedication: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/medications/${id}`);
        return response.data;
    },

    // Medication Reminders
    getMedicationReminders: async (medicationId?: string): Promise<ApiResponse<any[]>> => {
        const url = medicationId ? `/patients/me/reminders?medicationId=${medicationId}` : '/patients/me/reminders';
        const response = await api.get<ApiResponse<any[]>>(url);
        return response.data;
    },

    addMedicationReminder: async (data: any): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/patients/me/reminders', data);
        return response.data;
    },

    updateReminderStatus: async (id: string, isActive: boolean): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>(`/patients/me/reminders/${id}/status`, { isActive });
        return response.data;
    },


    // Vaccinations
    getVaccinations: async (): Promise<ApiResponse<Vaccination[]>> => {
        const response = await api.get<ApiResponse<Vaccination[]>>('/patients/me/vaccinations');
        return response.data;
    },

    addVaccination: async (data: Omit<Vaccination, 'id'>): Promise<ApiResponse<Vaccination>> => {
        const response = await api.post<ApiResponse<Vaccination>>('/patients/me/vaccinations', data);
        return response.data;
    },

    updateVaccination: async (id: string, data: Partial<Omit<Vaccination, 'id'>>): Promise<ApiResponse<Vaccination>> => {
        const response = await api.put<ApiResponse<Vaccination>>(`/patients/me/vaccinations/${id}`, data);
        return response.data;
    },

    removeVaccination: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/vaccinations/${id}`);
        return response.data;
    },

    // Vitals
    getVitals: async (type?: string): Promise<ApiResponse<VitalSign[]>> => {
        const url = type ? `/patients/me/vitals?type=${type}` : '/patients/me/vitals';
        const response = await api.get<ApiResponse<VitalSign[]>>(url);
        return response.data;
    },

    addVital: async (data: Omit<VitalSign, 'id'>): Promise<ApiResponse<VitalSign>> => {
        const response = await api.post<ApiResponse<VitalSign>>('/patients/me/vitals', data);
        return response.data;
    },

    removeVital: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/vitals/${id}`);
        return response.data;
    },

    deleteVital: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/vitals/${id}`);
        return response.data;
    },

    // Payment Methods
    getPaymentMethods: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/patients/me/payment-methods');
        return response.data;
    },

    addPaymentMethod: async (data: any): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>('/patients/me/payment-methods', data);
        return response.data;
    },

    setPrimaryPaymentMethod: async (id: string): Promise<ApiResponse> => {
        const response = await api.put<ApiResponse>(`/patients/me/payment-methods/${id}/primary`);
        return response.data;
    },

    deletePaymentMethod: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/payment-methods/${id}`);
        return response.data;
    },

    getTransactions: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/patients/me/transactions');
        return response.data;
    },



    // Medical Records
    getRecords: async (familyMemberId?: string): Promise<ApiResponse<any[]>> => {
        const url = familyMemberId
            ? `/patients/me/records?familyMemberId=${familyMemberId}`
            : '/patients/me/records';
        const response = await api.get<ApiResponse<any[]>>(url);
        return response.data;
    },

    getRecordById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/patients/me/records/${id}`);
        return response.data;
    },

    getPrescriptionPDF: async (id: string): Promise<string> => {
        return `${api.getBaseUrl()}/patients/me/prescriptions/${id}/pdf?token=${api.getToken()}`;
    },

    getRecordPDF: async (id: string): Promise<string> => {
        return `${api.getBaseUrl()}/patients/me/records/${id}/pdf?token=${api.getToken()}`;
    },

    // Prescriptions
    getPrescriptions: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get<ApiResponse<any[]>>('/patients/me/prescriptions');
        return response.data;
    },

    getPrescriptionById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/patients/me/prescriptions/${id}`);
        return response.data;
    },

    // Documents
    getDocuments: async (type?: string, recordId?: string): Promise<ApiResponse<any[]>> => {
        let url = '/patients/me/documents';
        const params = [];
        if (type) params.push(`type=${type}`);
        if (recordId) params.push(`recordId=${recordId}`);
        if (params.length) url += `?${params.join('&')}`;
        const response = await api.get<ApiResponse<any[]>>(url);
        return response.data;
    },

    uploadDocument: async (data: {
        type: string;
        name: string;
        file?: any;
        fileUrl?: string;
        recordId?: string;
    }): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('name', data.name);

        if (data.recordId) {
            formData.append('recordId', data.recordId);
        }

        if (data.file) {
            // @ts-ignore
            formData.append('file', {
                uri: data.file.uri,
                name: data.file.name || 'document.pdf',
                type: data.file.mimeType || 'application/pdf',
            });
        } else if (data.fileUrl) {
            formData.append('fileUrl', data.fileUrl);
        }

        const token = api.getToken();

        const response = await fetch(`${api.getBaseUrl()}/patients/me/documents`, {
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

    getDocumentById: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/patients/me/documents/${id}`);
        return response.data;
    },

    deleteDocument: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/documents/${id}`);
        return response.data;
    },

    shareDocument: async (id: string, expiryHours?: number): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/patients/me/documents/${id}/share`, { expiryHours });
        return response.data;
    },

    revokeDocumentShare: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>(`/patients/me/documents/${id}/share`);
        return response.data;
    },

    getSharedDocument: async (token: string): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>(`/patients/shared/${token}`);
        return response.data;
    },
};


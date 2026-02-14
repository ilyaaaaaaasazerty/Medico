import { api } from './api';

export interface DocumentTemplate {
    id: string;
    logoUrl?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    headerAddress?: string;
    headerPhone?: string;
    headerColor?: string;
    footerText?: string;
    signatureUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showRxSymbol?: boolean;
    showDiagnosis?: boolean;
    showPatientId?: boolean;
    showQrCode?: boolean;
    showWatermark?: boolean;
}

export interface UpdateTemplateInput {
    headerTitle?: string;
    headerSubtitle?: string;
    headerAddress?: string;
    headerPhone?: string;
    headerColor?: string;
    footerText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showRxSymbol?: boolean;
    showDiagnosis?: boolean;
    showPatientId?: boolean;
    showQrCode?: boolean;
    showWatermark?: boolean;
}

export const templateApi = {
    /**
     * Get prescription template settings
     */
    getPrescriptionTemplate: async () => {
        const response = await api.get<{ success: boolean; data: DocumentTemplate; isClinicTemplate?: boolean; message?: string }>('/templates/prescription');
        return response.data;
    },

    /**
     * Update prescription template settings
     */
    updatePrescriptionTemplate: async (data: UpdateTemplateInput) => {
        const response = await api.put<{ success: boolean; data: DocumentTemplate }>('/templates/prescription', data);
        return response.data;
    },

    /**
     * Upload logo for template
     */
    uploadLogo: async (uri: string) => {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

        formData.append('logo', {
            uri,
            name: filename,
            type,
        } as any);

        const response = await api.post<{ success: boolean; data: DocumentTemplate }>('/templates/prescription/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Upload signature for template
     */
    uploadSignature: async (uri: string) => {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'signature.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

        formData.append('signature', {
            uri,
            name: filename,
            type,
        } as any);

        const response = await api.post<{ success: boolean; data: DocumentTemplate }>('/templates/prescription/signature', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Reset template to defaults
     */
    resetTemplate: async () => {
        const response = await api.delete<{ success: boolean; message: string }>('/templates/prescription');
        return response.data;
    },
};

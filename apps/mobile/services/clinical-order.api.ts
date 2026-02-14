import { api } from './api';

export enum ClinicalOrderType {
    LAB = 'LAB',
    IMAGING = 'IMAGING',
    PROCEDURE = 'PROCEDURE',
    REFERRAL = 'REFERRAL'
}

export enum OrderStatus {
    PENDING = 'PENDING',
    ORDERED = 'ORDERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ClinicalOrder {
    id: string;
    appointmentId: string;
    recordId?: string;
    type: ClinicalOrderType;
    status: OrderStatus;
    description: string;
    metadata: any;
    createdAt: string;
}

export const clinicalOrderApi = {
    createOrder: async (data: {
        appointmentId: string;
        recordId?: string;
        type: ClinicalOrderType;
        description: string;
        metadata?: any;
    }): Promise<ApiResponse<ClinicalOrder>> => {
        const response = await api.post<ApiResponse<ClinicalOrder>>('/clinical-orders', data);
        return response.data;
    },

    getAppointmentOrders: async (appointmentId: string): Promise<ApiResponse<ClinicalOrder[]>> => {
        const response = await api.get<ApiResponse<ClinicalOrder[]>>(`/clinical-orders/appointment/${appointmentId}`);
        return response.data;
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<ApiResponse<ClinicalOrder>> => {
        const response = await api.put<ApiResponse<ClinicalOrder>>(`/clinical-orders/${orderId}/status`, { status });
        return response.data;
    },
};

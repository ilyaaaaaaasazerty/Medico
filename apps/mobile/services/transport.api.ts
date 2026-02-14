import { api } from './api';

// Types
export interface TransportProvider {
    id: string;
    companyName: string;
    type: 'AMBULANCE' | 'EMERGENCY' | 'NON_EMERGENCY' | 'WHEELCHAIR_ACCESSIBLE';
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    licenseNumber: string;
    isIndividual: boolean;
    walletBalance: number;
    verificationStatus: string;
    vehicles: Vehicle[];
    workingHours: TransportWorkingHours[];
}

export interface Vehicle {
    id: string;
    type: string;
    licensePlate: string;
    isAvailable: boolean;
    currentLat?: number;
    currentLng?: number;
}

export interface TransportWorkingHours {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export interface TransportRequest {
    id: string;
    patientId: string;
    patient?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        phone?: string;
    };
    pickupAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    destinationAddress?: string;
    destinationLat?: number;
    destinationLng?: number;
    scheduledAt?: string;
    status: 'PENDING' | 'ACCEPTED' | 'ARRIVED_PICKUP' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    costs?: number;
    acceptedAt?: string;
    arrivedAt?: string;
    pickedUpAt?: string;
    completedAt?: string;
    createdAt: string;
}

export interface DriverDashboard {
    profile: TransportProvider;
    stats: {
        completedToday: number;
        earningsToday: number;
    };
}

// API Functions
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const transportApi = {
    // Driver Profile
    getDriverDashboard: async (): Promise<ApiResponse<DriverDashboard>> => {
        const response = await api.get<ApiResponse<DriverDashboard>>('/transport/driver/me');
        return response.data;
    },

    // Status
    updateStatus: async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'): Promise<ApiResponse<TransportProvider>> => {
        const response = await api.post<ApiResponse<TransportProvider>>('/transport/driver/status', { status });
        return response.data;
    },
    updateLocation: async (lat: number, lng: number): Promise<ApiResponse<void>> => {
        const response = await api.post<ApiResponse<void>>('/transport/driver/location', { lat, lng });
        return response.data;
    },

    // Schedule
    getSchedule: async (): Promise<ApiResponse<TransportWorkingHours[]>> => {
        const response = await api.get<ApiResponse<TransportWorkingHours[]>>('/transport/driver/schedule');
        return response.data;
    },
    updateSchedule: async (schedule: { dayOfWeek: number; openTime: string; closeTime: string; isClosed?: boolean }[]): Promise<ApiResponse<TransportWorkingHours[]>> => {
        const response = await api.post<ApiResponse<TransportWorkingHours[]>>('/transport/driver/schedule', { schedule });
        return response.data;
    },

    // Requests
    getPendingRequests: async (): Promise<ApiResponse<TransportRequest[]>> => {
        const response = await api.get<ApiResponse<TransportRequest[]>>('/transport/driver/requests');
        return response.data;
    },
    getActiveRequest: async (): Promise<ApiResponse<TransportRequest | null>> => {
        const response = await api.get<ApiResponse<TransportRequest | null>>('/transport/driver/requests/active');
        return response.data;
    },
    acceptRequest: async (requestId: string): Promise<ApiResponse<TransportRequest>> => {
        const response = await api.post<ApiResponse<TransportRequest>>(`/transport/driver/requests/${requestId}/accept`);
        return response.data;
    },
    updateRequestStatus: async (requestId: string, status: 'ARRIVED_PICKUP' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'): Promise<ApiResponse<TransportRequest>> => {
        const response = await api.post<ApiResponse<TransportRequest>>(`/transport/driver/requests/${requestId}/status`, { status });
        return response.data;
    },

    // History
    getRideHistory: async (page = 1, limit = 20): Promise<ApiResponse<{ data: TransportRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
        const response = await api.get<ApiResponse<{ data: TransportRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(`/transport/driver/history?page=${page}&limit=${limit}`);
        return response.data;
    },

    // Patient-side (existing)
    requestTransport: async (data: {
        type: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        destinationAddress?: string;
        destinationLat?: number;
        destinationLng?: number;
        notes?: string;
    }): Promise<ApiResponse<TransportRequest>> => {
        const response = await api.post<ApiResponse<TransportRequest>>('/transport/requests', data);
        return response.data;
    },

    getPatientActiveRequest: async (): Promise<ApiResponse<TransportRequest | null>> => {
        const response = await api.get<ApiResponse<TransportRequest | null>>('/transport/requests/active');
        return response.data;
    },
};


export default transportApi;

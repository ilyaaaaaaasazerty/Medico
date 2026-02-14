import { api } from './api';

interface RegisterData {
    email: string;
    phone: string;
    password: string;
    role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'LAB_ADMIN';
}

interface LoginData {
    identifier: string;
    password: string;
}

interface VerifyOtpData {
    userId: string;
    code: string;
    type: 'PHONE' | 'EMAIL';
}

interface ResetPasswordData {
    email: string;
    code: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    phone: string | null;
    role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'LAB_ADMIN' | 'TRANSPORT_PROVIDER' | 'SYSTEM_ADMIN' | 'STAFF' | 'NURSE' | 'RECEPTIONIST' | 'SUPER_ADMIN';

    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    doctorId?: string;
    clinicId?: string;

    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    doctor?: {
        firstName: string;
        lastName: string;
    } | null;
    patient?: {
        firstName: string;
        lastName: string;
    } | null;
}


export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

interface RegisterResponse {
    id: string;
    email: string;
    phone: string;
    role: string;
    status: string;
}

export const authApi = {
    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
        const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', data);
        return response.data;
    },

    /**
     * Verify OTP code
     */
    verifyOtp: async (data: VerifyOtpData): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/verify-otp', data);
        return response.data;
    },

    /**
     * Resend OTP code
     */
    resendOtp: async (userId: string, type: 'PHONE' | 'EMAIL'): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/resend-otp', { userId, type });
        return response.data;
    },

    /**
     * Login user
     */
    login: async (data: LoginData): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
        return response.data;
    },

    /**
     * Refresh access token
     */
    refresh: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
        const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
        return response.data;
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Reset password with OTP
     */
    resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/reset-password', data);
        return response.data;
    },

    /**
     * Logout
     */
    logout: async (refreshToken: string): Promise<ApiResponse> => {
        const response = await api.delete<ApiResponse>('/auth/logout', {
            data: { refreshToken },
        });
        return response.data;
    },

    /**
     * Get current user
     */
    getMe: async (): Promise<ApiResponse<User>> => {
        const response = await api.get<ApiResponse<User>>('/auth/me');
        return response.data;
    },

    /**
     * Register a transport provider (taxi/ambulance)
     */
    registerTransport: async (data: {
        email: string;
        phone: string;
        password: string;
        companyName: string;
        licenseNumber: string;
        type: 'AMBULANCE' | 'NON_EMERGENCY';
    }): Promise<ApiResponse<RegisterResponse>> => {
        const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register-transport', data);
        return response.data;
    },
};


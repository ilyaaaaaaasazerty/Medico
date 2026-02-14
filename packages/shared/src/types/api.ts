// API Types

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    phone: string;
    password: string;
    role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'LAB_ADMIN';
}

export interface VerifyOtpRequest {
    userId: string;
    otp: string;
    type: 'PHONE' | 'EMAIL';
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your computer's IP for mobile device access
// Change this to process.env.EXPO_PUBLIC_API_URL in production
const BASE_URL = 'http://192.168.1.5:3001/api/v1';

const TOKEN_KEY = 'medico_access_token';
const REFRESH_TOKEN_KEY = 'medico_refresh_token';

class ApiClient {
    private client: AxiosInstance;
    private token: string | null = null;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (error: Error) => void;
    }> = [];

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const isPublicRoute = config.url?.startsWith('/auth') || config.url?.startsWith('/health');

                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                } else if (!isPublicRoute) {
                    // Block requests that require auth if token is missing (happens during logout)
                    return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor with automatic token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // Skip refresh for auth routes or already retried requests
                if (
                    error.response?.status !== 401 ||
                    originalRequest._retry ||
                    originalRequest.url?.includes('/auth/')
                ) {
                    return Promise.reject(error);
                }

                if (this.isRefreshing) {
                    // Queue requests while refreshing
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this.client(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                this.isRefreshing = true;

                try {
                    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    // Call refresh endpoint directly to avoid interceptor loop
                    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const newAccessToken = response.data?.data?.accessToken;
                    if (!newAccessToken) {
                        throw new Error('No access token in refresh response');
                    }

                    // Update stored token
                    await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
                    this.token = newAccessToken;

                    // Process queued requests
                    this.failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
                    this.failedQueue = [];

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return this.client(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - clear tokens and reject all queued requests
                    this.failedQueue.forEach(({ reject }) => reject(refreshError as Error));
                    this.failedQueue = [];

                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    this.token = null;

                    // Navigate to login
                    try {
                        const { router } = require('expo-router');
                        router.replace('/(auth)/login');
                    } catch {
                        // Ignore navigation errors
                    }

                    return Promise.reject(refreshError);
                } finally {
                    this.isRefreshing = false;
                }
            }
        );
    }

    setToken(token: string | null) {
        this.token = token;
    }

    getToken() {
        return this.token;
    }

    getBaseUrl() {
        return BASE_URL;
    }

    async get<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.get<T>(url, config);
        return response;
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.post<T>(url, data, config);
        return response;
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.put<T>(url, data, config);
        return response;
    }

    async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
        const response = await this.client.patch<T>(url, data, config);
        return response;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.delete<T>(url, config);
        return response;
    }
}

export const api = new ApiClient();

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { authApi, User, ApiResponse } from '@/services/auth.api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (identifier: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'medico_access_token';
const REFRESH_TOKEN_KEY = 'medico_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredToken();
    }, []);

    const loadStoredToken = async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (token) {
                api.setToken(token);
                // Validate token by fetching user profile
                try {
                    const response = await authApi.getMe();
                    if (response.success && response.data) {
                        setUser(response.data);
                    }
                } catch (error: any) {
                    // Token invalid or expired, try refresh
                    if (error.response?.status === 401) {
                        await handleTokenRefresh();
                    } else {
                        await clearTokens();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading token:', error);
            await clearTokens();
        } finally {
            setIsLoading(false);
        }
    };

    const handleTokenRefresh = async () => {
        try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (!storedRefreshToken) {
                await clearTokens();
                return;
            }

            const response = await authApi.refresh(storedRefreshToken);
            if (!response.data?.accessToken) {
                await clearTokens();
                return;
            }

            const { accessToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            api.setToken(accessToken);

            // Fetch user with new token
            const userResponse = await authApi.getMe();
            if (userResponse.success && userResponse.data) {
                setUser(userResponse.data);
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            await clearTokens();
        }
    };

    const clearTokens = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        api.setToken(null);
        setUser(null);
    };

    const login = async (identifier: string, password: string): Promise<User> => {
        const response = await authApi.login({ identifier, password });

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Login failed');
        }

        const { accessToken, refreshToken, user: userData } = response.data;

        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

        api.setToken(accessToken);
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (storedRefreshToken) {
                await authApi.logout(storedRefreshToken);
            }
        } catch (error) {
            // Ignore logout errors
            console.log('Logout API error:', error);
        } finally {
            await clearTokens();
            // Navigate to login screen
            const { router } = require('expo-router');
            router.replace('/(auth)/login');
        }
    };

    const refreshTokenFn = async () => {
        await handleTokenRefresh();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshToken: refreshTokenFn,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

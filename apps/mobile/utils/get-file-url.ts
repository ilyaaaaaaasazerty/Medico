import { api } from '@/services/api';

/**
 * Helper to get the full URL for a file.
 * If the URL is already absolute, it returns it as is.
 * If it is relative, it prepends the backend base URL (stripping /api/v1 if needed).
 */
export const getFileUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // api.getBaseUrl returns something like http://192.168.1.7:3001/api/v1
    const baseUrl = api.getBaseUrl();
    // Strip /api/v1 or /api to get the server origin
    const origin = baseUrl.replace(/\/api(\/v1)?$/, '');

    // Ensure url starts with /
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${origin}${path}`;
};

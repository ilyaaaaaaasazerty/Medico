import { api } from './api';

// Profile info that can be on a User
export interface UserProfile {
    id: string;
    role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN' | 'LAB_ADMIN';
    patient?: { firstName: string; lastName: string; avatarUrl?: string };
    doctor?: { firstName: string; lastName: string; avatarUrl?: string };
    clinicAdmin?: { clinic: { name: string; logoUrl?: string } };
    labAdmin?: { labCenter: { name: string; logoUrl?: string } };
    online?: boolean;
}


export interface ThreadParticipant {
    id: string;
    userId: string;
    user: UserProfile;
    lastReadAt?: string;
}

export interface Message {
    id: string;
    threadId: string;
    senderId: string;
    sender?: UserProfile;
    content: string;
    attachments?: {
        type: 'LAB_RESULT' | 'IMAGE' | 'DOCUMENT' | 'PRESCRIPTION' | 'MEDICAL_RECORD';
        id?: string;
        url: string;
        name?: string;
        metadata?: any;
    }[];
    isRead: boolean;
    metadata?: any;
    createdAt: string;
    readAt?: string;
}


export interface MessageThread {
    id: string;
    subject?: string;
    lastMessageAt: string;
    participants: ThreadParticipant[];
    messages: Message[]; // Last message preview
}

// Helper to get display name from a user profile
export function getDisplayName(user: UserProfile): string {
    if (user.patient) return `${user.patient.firstName} ${user.patient.lastName}`;
    if (user.doctor) return `Dr. ${user.doctor.firstName} ${user.doctor.lastName}`;
    if (user.clinicAdmin?.clinic) return user.clinicAdmin.clinic.name;
    if (user.labAdmin?.labCenter) return user.labAdmin.labCenter.name;
    return 'Unknown';
}

export function getAvatarUrl(user: UserProfile): string | undefined {
    if (user.patient) return user.patient.avatarUrl;
    if (user.doctor) return user.doctor.avatarUrl;
    if (user.clinicAdmin?.clinic) return user.clinicAdmin.clinic.logoUrl;
    if (user.labAdmin?.labCenter) return user.labAdmin.labCenter.logoUrl;
    return undefined;
}

export const messageApi = {
    getThreads: async () => {
        const response = await api.get<{ success: true; data: MessageThread[] }>('/messages/threads');
        return response.data;
    },

    getThread: async (threadId: string) => {
        const response = await api.get<{ success: true; data: MessageThread }>(`/messages/threads/${threadId}/details`);
        return response.data;
    },


    getThreadMessages: async (threadId: string) => {
        const response = await api.get<{ success: true; data: Message[] }>(`/messages/threads/${threadId}`);
        return response.data;
    },

    startThread: async (recipientUserId: string) => {
        const response = await api.post<{ success: true; data: MessageThread }>('/messages/threads', { recipientUserId });
        return response.data;
    },

    sendMessage: async (threadId: string, content: string, attachments?: any) => {
        const response = await api.post<{ success: true; data: Message }>(`/messages/threads/${threadId}`, { content, attachments });
        return response.data;
    },

    markAsRead: async (messageId: string) => {
        const response = await api.put<{ success: true }>(`/messages/${messageId}/read`);
        return response.data;
    }
};


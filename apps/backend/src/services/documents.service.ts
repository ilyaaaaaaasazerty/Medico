import { PrismaClient, DocumentType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const documentsService = {
    // Upload/create a document
    createDocument: async (data: {
        patientId: string;
        recordId?: string;
        type: DocumentType;
        name: string;
        fileUrl: string;
        fileSize?: number;
        mimeType?: string;
        uploadedBy: string;
    }) => {
        return prisma.document.create({
            data: {
                patientId: data.patientId,
                recordId: data.recordId,
                type: data.type,
                name: data.name,
                fileUrl: data.fileUrl,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                uploadedBy: data.uploadedBy,
            },
        });
    },

    // Get document by ID
    getDocumentById: async (documentId: string, patientId?: string) => {
        const where: any = { id: documentId };
        if (patientId) {
            where.patientId = patientId;
        }

        return prisma.document.findFirst({
            where,
            include: {
                record: true,
            },
        });
    },

    // Get patient's documents
    getPatientDocuments: async (patientId: string, options?: {
        type?: DocumentType;
        recordId?: string;
        limit?: number;
        offset?: number;
    }) => {
        const where: any = { patientId };

        if (options?.type) {
            where.type = options.type;
        }
        if (options?.recordId) {
            where.recordId = options.recordId;
        }

        return prisma.document.findMany({
            where,
            include: {
                record: true,
            },
            orderBy: { uploadedAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    },

    // Delete document
    deleteDocument: async (documentId: string, patientId: string) => {
        const document = await prisma.document.findFirst({
            where: { id: documentId, patientId },
        });

        if (!document) {
            throw new Error('Document not found');
        }

        return prisma.document.delete({
            where: { id: documentId },
        });
    },

    // Generate share link
    generateShareLink: async (documentId: string, patientId: string, expiryHours: number = 24) => {
        const document = await prisma.document.findFirst({
            where: { id: documentId, patientId },
        });

        if (!document) {
            throw new Error('Document not found');
        }

        const shareToken = crypto.randomBytes(32).toString('hex');
        const shareExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        return prisma.document.update({
            where: { id: documentId },
            data: {
                isShared: true,
                shareToken,
                shareExpiry,
            },
        });
    },

    // Get shared document by token
    getSharedDocument: async (token: string) => {
        const document = await prisma.document.findFirst({
            where: {
                shareToken: token,
                isShared: true,
            },
        });

        if (!document) {
            throw new Error('Document not found or link expired');
        }

        if (document.shareExpiry && document.shareExpiry < new Date()) {
            throw new Error('Share link has expired');
        }

        return document;
    },

    // Revoke share link
    revokeShareLink: async (documentId: string, patientId: string) => {
        const document = await prisma.document.findFirst({
            where: { id: documentId, patientId },
        });

        if (!document) {
            throw new Error('Document not found');
        }

        return prisma.document.update({
            where: { id: documentId },
            data: {
                isShared: false,
                shareToken: null,
                shareExpiry: null,
            },
        });
    },
};

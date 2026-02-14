import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const prescriptionsService = {
    // Create a prescription
    createPrescription: async (data: {
        appointmentId?: string;
        recordId?: string;
        doctorId: string;
        patientId: string;
        diagnosis?: string;
        instructions?: string;
        temporarySignature?: string;
        validUntil?: Date;
        items: Array<{
            medication: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions?: string;
            quantity?: number;
        }>;
    }) => {
        return prisma.prescription.create({
            data: {
                appointmentId: data.appointmentId,
                recordId: data.recordId,
                doctorId: data.doctorId,
                patientId: data.patientId,
                diagnosis: data.diagnosis,
                instructions: data.instructions,
                temporarySignature: data.temporarySignature,
                validUntil: data.validUntil,
                items: {
                    create: data.items,
                },
            },
            include: {
                items: true,
                doctor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        specialties: {
                            include: {
                                specialty: true
                            }
                        }
                    },
                },
            },
        });
    },

    // Get prescription by ID
    getPrescriptionById: async (prescriptionId: string) => {
        return prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: {
                items: true,
                doctor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        specialties: {
                            include: {
                                specialty: true
                            }
                        }
                    },
                },
                appointment: true,
                record: true,
            },
        });
    },

    // Get patient's prescriptions
    getPatientPrescriptions: async (patientId: string, options?: {
        limit?: number;
        offset?: number;
    }) => {
        return prisma.prescription.findMany({
            where: { patientId },
            include: {
                items: true,
                doctor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        specialties: {
                            include: {
                                specialty: true
                            }
                        }
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    },

    // Get doctor's prescriptions
    getDoctorPrescriptions: async (doctorId: string, options?: {
        patientId?: string;
        limit?: number;
        offset?: number;
    }) => {
        const where: any = { doctorId };
        if (options?.patientId) {
            where.patientId = options.patientId;
        }

        return prisma.prescription.findMany({
            where,
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    },

    // Update prescription PDF URL
    updatePrescriptionPdf: async (prescriptionId: string, pdfUrl: string) => {
        return prisma.prescription.update({
            where: { id: prescriptionId },
            data: { pdfUrl },
        });
    },

    // Add items to prescription
    addPrescriptionItems: async (prescriptionId: string, items: Array<{
        medication: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
        quantity?: number;
    }>) => {
        return prisma.prescriptionItem.createMany({
            data: items.map(item => ({
                prescriptionId,
                ...item,
            })),
        });
    },

    // Delete prescription item
    deletePrescriptionItem: async (itemId: string) => {
        return prisma.prescriptionItem.delete({
            where: { id: itemId },
        });
    },

    // Prescription Templates
    getTemplates: async (doctorId: string) => {
        return prisma.prescriptionTemplate.findMany({
            where: { doctorId },
            orderBy: { name: 'asc' },
        });
    },

    createTemplate: async (data: {
        doctorId: string;
        name: string;
        diagnosis?: string;
        medications: any;
        instructions?: string;
    }) => {
        return prisma.prescriptionTemplate.create({
            data: {
                doctorId: data.doctorId,
                name: data.name,
                diagnosis: data.diagnosis,
                medications: data.medications,
                instructions: data.instructions,
            },
        });
    },

    updateTemplate: async (templateId: string, doctorId: string, data: {
        name?: string;
        diagnosis?: string;
        medications?: any;
        instructions?: string;
    }) => {
        return prisma.prescriptionTemplate.updateMany({
            where: { id: templateId, doctorId },
            data,
        });
    },

    deleteTemplate: async (templateId: string, doctorId: string) => {
        return prisma.prescriptionTemplate.deleteMany({
            where: { id: templateId, doctorId },
        });
    },

    getTemplateById: async (templateId: string, doctorId: string) => {
        return prisma.prescriptionTemplate.findFirst({
            where: { id: templateId, doctorId },
        });
    },
};

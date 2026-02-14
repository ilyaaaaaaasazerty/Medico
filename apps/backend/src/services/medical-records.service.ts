import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const medicalRecordsService = {
    // Create a medical record for an appointment
    createRecord: async (data: {
        patientId: string;
        doctorId: string;
        appointmentId?: string;
        familyMemberId?: string;
        visitDate: Date;
        chiefComplaint?: string;
        symptoms?: string;
        diagnosis?: string;
        notes?: string;
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        followUpDate?: Date;
        followUpNotes?: string;
    }) => {
        return prisma.medicalRecord.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                appointmentId: data.appointmentId,
                familyMemberId: data.familyMemberId,
                visitDate: data.visitDate,
                chiefComplaint: data.chiefComplaint,
                symptoms: data.symptoms,
                diagnosis: data.diagnosis,
                notes: data.notes,
                bloodPressure: data.bloodPressure,
                heartRate: data.heartRate,
                temperature: data.temperature,
                weight: data.weight,
                followUpDate: data.followUpDate,
                followUpNotes: data.followUpNotes,
            },
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                    },
                },
            },
        });
    },

    // Update a medical record
    updateRecord: async (recordId: string, data: {
        chiefComplaint?: string;
        symptoms?: string;
        diagnosis?: string;
        notes?: string;
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        followUpDate?: Date;
        followUpNotes?: string;
    }) => {
        return prisma.medicalRecord.update({
            where: { id: recordId },
            data,
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                    },
                },
            },
        });
    },

    // Get patient's medical records timeline
    getPatientRecords: async (patientId: string, options?: {
        familyMemberId?: string;
        limit?: number;
        offset?: number;
    }) => {
        const where: any = { patientId };

        if (options?.familyMemberId) {
            where.familyMemberId = options.familyMemberId;
        }

        return prisma.medicalRecord.findMany({
            where,
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                familyMember: true,
            },
            orderBy: { visitDate: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    },

    // Get single record by ID
    getRecordById: async (recordId: string, patientId?: string) => {
        const where: any = { id: recordId };
        if (patientId) {
            where.patientId = patientId;
        }

        return prisma.medicalRecord.findFirst({
            where,
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                familyMember: true,
                appointment: true,
            },
        });
    },

    // Get record by appointment ID
    getRecordByAppointmentId: async (appointmentId: string) => {
        return prisma.medicalRecord.findUnique({
            where: { appointmentId },
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                    },
                },
            },
        });
    },

    // Doctor gets patient's records
    getDoctorPatientRecords: async (doctorId: string, patientId: string) => {
        // Get records where doctor was involved or has permission
        return prisma.medicalRecord.findMany({
            where: {
                patientId,
                OR: [
                    { doctorId },
                    { appointment: { doctorId } },
                ],
            },
            include: {
                attachments: true,
                prescription: {
                    include: {
                        items: true,
                    },
                },
                familyMember: true,
            },
            orderBy: { visitDate: 'desc' },
        });
    },

    // Doctor gets all their records
    getDoctorRecords: async (doctorId: string, options?: {
        patientId?: string;
        limit?: number;
        offset?: number;
    }) => {
        const where: any = { doctorId };
        if (options?.patientId) {
            where.patientId = options.patientId;
        }

        return prisma.medicalRecord.findMany({
            where,
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    }
                },
                familyMember: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },
                prescription: {
                    select: {
                        id: true,
                    }
                }
            },
            orderBy: { visitDate: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    },

    // Delete a record
    deleteRecord: async (recordId: string) => {
        return prisma.medicalRecord.delete({
            where: { id: recordId },
        });
    },
};

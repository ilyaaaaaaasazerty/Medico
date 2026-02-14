import { prisma } from '../lib/prisma.js';
import { Gender, BloodType } from '@prisma/client';
import { NotFound } from '../middleware/errorHandler.js';

interface CreatePatientInput {
    userId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    phone?: string;
    bloodType?: BloodType;
    height?: number;
    weight?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    emergencyName?: string;
    emergencyPhone?: string;
}

interface UpdatePatientInput {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    avatarUrl?: string;
    bloodType?: BloodType;
    height?: number;
    weight?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    emergencyName?: string;
    emergencyPhone?: string;
}

/**
 * Create patient profile
 */
export async function createPatientProfile(input: CreatePatientInput) {
    // Check if patient already exists
    const existing = await prisma.patient.findUnique({
        where: { userId: input.userId },
    });

    if (existing) {
        throw new Error('PROFILE_EXISTS');
    }

    const patient = await prisma.patient.create({
        data: input,
        include: {
            user: {
                select: {
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                },
            },
        },
    });

    return patient;
}

/**
 * Get patient profile by user ID
 */
export async function getPatientByUserId(userId: string) {
    const patient = await prisma.patient.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    phoneVerified: true,
                    wallet: true,
                },
            },
            allergies: true,
            conditions: true,
            medications: {
                include: { reminders: true },
            },
            vaccinations: true,
            familyMembers: true,
        },
    });

    if (!patient) {
        throw new Error('PATIENT_NOT_FOUND');
    }

    return patient;
}

/**
 * Update patient profile
 */
export async function updatePatientProfile(userId: string, input: UpdatePatientInput) {
    const patient = await prisma.patient.findUnique({
        where: { userId },
    });

    if (!patient) {
        throw NotFound('Patient profile not found');
    }

    const updated = await prisma.patient.update({
        where: { userId },
        data: input,
        include: {
            user: {
                select: {
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                },
            },
        },
    });

    return updated;
}

/**
 * Check if patient profile exists
 */
export async function patientProfileExists(userId: string): Promise<boolean> {
    const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!patient;
}

/**
 * Get patient ID by user ID
 */
export async function getPatientId(userId: string): Promise<string> {
    const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!patient) {
        throw new Error('PATIENT_NOT_FOUND');
    }

    return patient.id;
}

/**
 * Get comprehensive patient health profile for doctors
 */
export async function getPatientHealthProfile(patientId: string) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: {
                user: {
                    select: {
                        email: true,
                        phone: true,
                    },
                },
                allergies: {
                    orderBy: { severity: 'desc' }
                },
                conditions: {
                    orderBy: { createdAt: 'desc' }
                },
                medications: {
                    where: { endDate: { equals: null } },
                    orderBy: { startDate: 'desc' }
                },
                vaccinations: {
                    orderBy: { dateGiven: 'desc' }
                }
            },
        });

        if (!patient) {
            throw new Error('PATIENT_NOT_FOUND');
        }

        return patient;
    } catch (error) {
        console.error(`[PatientService] Error in getPatientHealthProfile for ${patientId}:`, error);
        throw error;
    }
}

/**
 * Get patient dashboard data
 */
export async function getPatientDashboard(userId: string) {
    const patient = await prisma.patient.findUnique({
        where: { userId },
        include: {
            user: { include: { wallet: true } },
            appointments: {
                where: {
                    scheduledDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CALLED', 'EMERGENCY', 'IN_PROGRESS'] },
                },
                orderBy: { scheduledDate: 'asc' },
                take: 3,
                include: {
                    doctor: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                            emergencyMode: true,
                        },
                    },
                    service: {
                        select: { name: true },
                    },
                },
            },
            medications: {
                where: { endDate: null },
                include: { reminders: true },
                take: 5,
            },
            allergies: {
                where: { severity: 'SEVERE' },
                take: 3,
            },
        },
    });

    if (!patient) {
        throw new Error('PATIENT_NOT_FOUND');
    }

    return {
        profile: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            avatarUrl: patient.avatarUrl,
        },
        creditBalance: (patient.user as any).wallet?.balance || 0,
        upcomingAppointments: patient.appointments,
        activeMedications: patient.medications,
        severeAllergies: patient.allergies,
        recentVitals: await prisma.vitalSign.findMany({
            where: { patientId: patient.id },
            orderBy: { recordedAt: 'desc' },
            take: 10
        })
    };
}

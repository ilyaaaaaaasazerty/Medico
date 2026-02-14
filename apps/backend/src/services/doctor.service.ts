import { prisma } from '../lib/prisma.js';

interface CreateDoctorInput {
    userId: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    licenseExpiry: Date;
    yearsExperience?: number;
    bio?: string;
    consultationFee?: number;
}

interface UpdateDoctorInput {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    licenseExpiry?: Date;
    yearsExperience?: number;
    bio?: string;
    avatarUrl?: string;
    consultationFee?: number;
}

/**
 * Create doctor profile after registration
 */
export async function createDoctorProfile(input: CreateDoctorInput) {
    const existing = await prisma.doctor.findUnique({
        where: { userId: input.userId },
    });

    if (existing) {
        throw new Error('PROFILE_EXISTS');
    }

    const doctor = await prisma.doctor.create({
        data: {
            ...input,
            verificationStatus: 'PENDING',
        },
        include: {
            user: {
                select: { email: true, phone: true, role: true },
            },
            specialties: { include: { specialty: true } },
        },
    });

    return doctor;
}

/**
 * Get doctor by user ID
 */
export async function getDoctorByUserId(userId: string) {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        include: {
            user: {
                select: { email: true, phone: true, role: true, status: true },
            },
            specialties: { include: { specialty: true } },
            education: true,
            documents: true,
        },
    });

    if (!doctor) {
        throw new Error('DOCTOR_NOT_FOUND');
    }

    return doctor;
}

/**
 * Update doctor profile
 */
export async function updateDoctorProfile(userId: string, input: UpdateDoctorInput) {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });

    if (!doctor) {
        throw new Error('DOCTOR_NOT_FOUND');
    }

    return prisma.doctor.update({
        where: { userId },
        data: input,
        include: {
            user: { select: { email: true, phone: true, role: true } },
            specialties: { include: { specialty: true } },
        },
    });
}

/**
 * Toggle emergency mode for doctor
 */
export async function toggleEmergencyMode(userId: string, active: boolean) {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true, firstName: true, lastName: true },
    });

    if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

    const updated = await prisma.doctor.update({
        where: { id: doctor.id },
        data: { emergencyMode: active },
    });

    // Notify patients with today's appointments
    if (active) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
                scheduledDate: { gte: today, lt: tomorrow },
                status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            },
            include: { patient: { include: { user: true } } },
        });

        // Import notification service
        const { notificationService } = await import('./notification.service.js');

        for (const apt of appointments) {
            await notificationService.createNotification(
                apt.patient.userId,
                'EMERGENCY',
                '⚠️ Emergency Notice',
                `Dr. ${doctor.firstName} ${doctor.lastName} has activated emergency mode. Your appointment may be affected.`,
                { appointmentId: apt.id, doctorId: doctor.id }
            );
        }
    }

    return updated;
}

/**
 * Shift all today's pending appointments by X minutes for doctor
 */
export async function shiftSchedule(userId: string, delayMinutes: number) {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true, firstName: true, lastName: true },
    });

    if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
        where: {
            doctorId: doctor.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            scheduledDate: { gte: today, lt: tomorrow },
        },
        include: { patient: { include: { user: true } } },
    });

    // Import notification service
    const { notificationService } = await import('./notification.service.js');

    const updates = appointments.map(async (apt) => {
        const [hours, minutes] = apt.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(apt.scheduledDate);
        scheduledDateTime.setHours(hours, minutes + delayMinutes);

        // Update BOTH date and time to handle rollovers (e.g., 23:55 + 10m -> 00:05 next day)
        const newTime = `${String(scheduledDateTime.getHours()).padStart(2, '0')}:${String(scheduledDateTime.getMinutes()).padStart(2, '0')}`;

        // Notify patient
        await notificationService.createNotification(
            apt.patient.userId,
            'SCHEDULE_CHANGE',
            '🕒 Appointment Update',
            `Your appointment with Dr. ${doctor.lastName} has been delayed by ${delayMinutes} minutes. New time: ${newTime}.`,
            { appointmentId: apt.id, newTime }
        );

        return prisma.appointment.update({
            where: { id: apt.id },
            data: {
                scheduledTime: newTime,
                scheduledDate: scheduledDateTime
            },
        });
    });

    await Promise.all(updates);

    return { success: true, count: updates.length };
}



/**
 * Check if doctor profile exists
 */
export async function doctorProfileExists(userId: string): Promise<boolean> {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!doctor;
}

/**
 * Get verification status
 */
export async function getVerificationStatus(userId: string) {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: {
            verificationStatus: true,
            documents: {
                select: { id: true, type: true, status: true, uploadedAt: true },
            },
        },
    });

    if (!doctor) {
        throw new Error('DOCTOR_NOT_FOUND');
    }

    return {
        status: doctor.verificationStatus,
        documents: doctor.documents,
    };
}

/**
 * Get doctor dashboard
 */
export async function getDoctorDashboard(userId: string) {
    const doctor = await prisma.doctor.findUnique({
        where: { userId },
        include: {
            appointments: {
                where: {
                    scheduledDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CALLED', 'EMERGENCY', 'IN_PROGRESS'] },
                },
                orderBy: [
                    { scheduledDate: 'asc' },
                    { scheduledTime: 'asc' }
                ],
                take: 10,
                include: {
                    patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
                    service: { select: { name: true } },
                },
            },
            _count: {
                select: {
                    appointments: true,
                    reviews: true,
                },
            },
        },
    });

    if (!doctor) {
        throw new Error('DOCTOR_NOT_FOUND');
    }

    // Get earnings from Wallet model
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { redeemableBalance: true },
    });

    return {
        profile: {
            id: doctor.id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            avatarUrl: doctor.avatarUrl,
            verificationStatus: doctor.verificationStatus,
            emergencyMode: doctor.emergencyMode,
        },
        upcomingAppointments: doctor.appointments,
        stats: {
            totalAppointments: doctor._count.appointments,
            totalReviews: doctor._count.reviews,
            totalEarnings: wallet?.redeemableBalance || 0,
        },
    };
}

/**
 * Get doctor appointments with filtering
 */
export async function getDoctorAppointments(doctorId: string, status?: string, start?: string, end?: string) {
    const where: any = { doctorId };

    if (status) {
        where.status = status;
    }

    if (start && end) {
        where.scheduledDate = {
            gte: new Date(start),
            lte: new Date(end),
        };
    } else if (start) {
        where.scheduledDate = { gte: new Date(start) };
    }

    return prisma.appointment.findMany({
        where,
        orderBy: [
            { scheduledDate: 'asc' },
            { scheduledTime: 'asc' }
        ],
        include: {
            patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
            service: { select: { name: true } },
            clinic: { select: { name: true, city: true } },
        },
    });
}

// ============================================
// EDUCATION
// ============================================

interface EducationInput {
    doctorId: string;
    degree: string;
    institution: string;
    year: number;
}

export async function getEducation(doctorId: string) {
    return prisma.education.findMany({
        where: { doctorId },
        orderBy: { year: 'desc' },
    });
}

export async function addEducation(input: EducationInput) {
    return prisma.education.create({ data: input });
}

export async function removeEducation(doctorId: string, id: string) {
    const edu = await prisma.education.findFirst({ where: { id, doctorId } });
    if (!edu) throw new Error('EDUCATION_NOT_FOUND');
    await prisma.education.delete({ where: { id } });
    return { success: true };
}

// ============================================
// DOCUMENTS
// ============================================

interface DocumentInput {
    doctorId: string;
    type: string;
    fileUrl: string;
    fileName: string;
}

export async function getDocuments(doctorId: string) {
    return prisma.doctorDocument.findMany({
        where: { doctorId },
        orderBy: { uploadedAt: 'desc' },
    });
}

export async function addDocument(input: DocumentInput) {
    return prisma.doctorDocument.create({
        data: {
            ...input,
            status: 'PENDING',
        } as any,
    });
}

export async function removeDocument(doctorId: string, id: string) {
    const doc = await prisma.doctorDocument.findFirst({ where: { id, doctorId } });
    if (!doc) throw new Error('DOCUMENT_NOT_FOUND');
    await prisma.doctorDocument.delete({ where: { id } });
    return { success: true };
}

// ============================================
// SPECIALTIES
// ============================================

export async function getDoctorSpecialties(doctorId: string) {
    return prisma.doctorSpecialty.findMany({
        where: { doctorId },
        include: { specialty: true },
    });
}

export async function addDoctorSpecialty(doctorId: string, specialtyId: string) {
    // Check if already exists
    const existing = await prisma.doctorSpecialty.findFirst({
        where: { doctorId, specialtyId },
    });
    if (existing) throw new Error('SPECIALTY_ALREADY_ADDED');

    return prisma.doctorSpecialty.create({
        data: { doctorId, specialtyId },
        include: { specialty: true },
    });
}

export async function removeDoctorSpecialty(doctorId: string, specialtyId: string) {
    const ds = await prisma.doctorSpecialty.findFirst({ where: { doctorId, specialtyId } });
    if (!ds) throw new Error('SPECIALTY_NOT_FOUND');
    await prisma.doctorSpecialty.delete({ where: { id: ds.id } });
    return { success: true };
}

/**
 * List all specialties
 */
export async function getAllSpecialties() {
    return prisma.specialty.findMany({
        orderBy: { name: 'asc' },
    });
}

/**
 * Find doctor by email or ID (for clinic affiliation)
 */
export async function findDoctorByEmailOrId(query: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

    const doctor = await prisma.doctor.findFirst({
        where: isUuid
            ? { id: query }
            : { user: { email: { equals: query, mode: 'insensitive' } } },
        include: {
            user: { select: { email: true } },
            specialties: { include: { specialty: true } },
        },
    });

    if (!doctor) return null;

    return {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        avatarUrl: doctor.avatarUrl,
        email: doctor.user.email,
        specialties: doctor.specialties.map(s => s.specialty.name),
        verificationStatus: doctor.verificationStatus,
    };
}
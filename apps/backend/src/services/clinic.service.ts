import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { StaffRole, UserStatus } from '@prisma/client';
import { clinicOperationsService } from './clinic-operations.service.js';

interface RegisterClinicInput {
    userId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    description?: string;
    website?: string;
    latitude?: number;
    longitude?: number;
}

interface UpdateClinicInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    description?: string;
    website?: string;
    logoUrl?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Register new clinic
 */
export async function registerClinic(input: RegisterClinicInput) {
    // Check if admin already has a clinic
    const existing = await prisma.clinicAdmin.findUnique({
        where: { userId: input.userId },
        include: { clinic: true },
    });

    if (existing) {
        throw new Error('CLINIC_EXISTS');
    }

    // Create clinic and admin in a transaction
    const clinic = await prisma.clinic.create({
        data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            city: input.city,
            state: input.state,
            country: input.country,
            postalCode: input.postalCode,
            description: input.description,
            website: input.website,
            latitude: input.latitude,
            longitude: input.longitude,
            verificationStatus: 'PENDING',
            admins: {
                create: {
                    userId: input.userId,
                    role: 'OWNER',
                },
            },
        },
        include: {
            admins: { include: { user: { select: { email: true, phone: true } } } },
        },
    });

    return clinic;
}

/**
 * Get clinic by user ID
 */
export async function getClinicByUserId(userId: string, role?: string) {
    let clinicId: string;

    if (role === 'STAFF') {
        const staff = await prisma.clinicStaff.findUnique({
            where: { userId },
            select: { clinicId: true },
        });
        if (!staff) throw new Error('CLINIC_NOT_FOUND');
        clinicId = staff.clinicId;
    } else {
        const admin = await prisma.clinicAdmin.findUnique({
            where: { userId },
            select: { clinicId: true },
        });
        if (!admin) throw new Error('CLINIC_NOT_FOUND');
        clinicId = admin.clinicId;
    }

    const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        include: {
            admins: { include: { user: { select: { email: true, phone: true, role: true } } } },
            staff: true,
            rooms: true,
            workingHours: true,
            doctors: { include: { doctor: { select: { firstName: true, lastName: true } } } },
        },
    });

    if (!clinic) {
        throw new Error('CLINIC_NOT_FOUND');
    }

    return clinic;
}

/**
 * Update clinic profile
 */
export async function updateClinic(userId: string, input: UpdateClinicInput) {
    const admin = await prisma.clinicAdmin.findUnique({
        where: { userId },
        select: { clinicId: true },
    });

    if (!admin) {
        throw new Error('CLINIC_NOT_FOUND');
    }

    return prisma.clinic.update({
        where: { id: admin.clinicId },
        data: input,
    });
}

/**
 * Toggle emergency mode for clinic
 */
export async function toggleEmergencyMode(userId: string, active: boolean) {
    const admin = await prisma.clinicAdmin.findUnique({
        where: { userId },
        select: { clinicId: true },
    });

    if (!admin) throw new Error('CLINIC_NOT_FOUND');

    return prisma.clinic.update({
        where: { id: admin.clinicId },
        data: { emergencyMode: active },
    });
}

/**
 * Shift all today's pending appointments by X minutes
 */
export async function shiftSchedule(userId: string, delayMinutes: number) {
    const admin = await prisma.clinicAdmin.findUnique({
        where: { userId },
        select: { clinicId: true },
    });

    if (!admin) throw new Error('CLINIC_NOT_FOUND');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId: admin.clinicId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            scheduledDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
    });

    const updates = appointments.map((apt) => {
        // Parse "HH:mm" time and add delay
        const [hours, minutes] = apt.scheduledTime.split(':').map(Number);
        const date = new Date(today);
        date.setHours(hours, minutes + delayMinutes);

        const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        return prisma.appointment.update({
            where: { id: apt.id },
            data: { scheduledTime: newTime },
        });
    });

    return Promise.all(updates);
}

/**
 * Check if clinic profile exists
 */
export async function clinicProfileExists(userId: string): Promise<boolean> {
    const admin = await prisma.clinicAdmin.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (admin) return true;

    const staff = await prisma.clinicStaff.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!staff;
}

/**
 * Get clinic dashboard
 */
export async function getClinicDashboard(userId: string, role?: string) {
    let clinicId: string;

    if (role === 'STAFF') {
        const staff = await prisma.clinicStaff.findUnique({
            where: { userId },
            select: { clinicId: true },
        });
        if (!staff) throw new Error('CLINIC_NOT_FOUND');
        clinicId = staff.clinicId;
    } else {
        const admin = await prisma.clinicAdmin.findUnique({
            where: { userId },
            select: { clinicId: true },
        });
        if (!admin) throw new Error('CLINIC_NOT_FOUND');
        clinicId = admin.clinicId;
    }

    const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        include: {
            _count: {
                select: {
                    doctors: true,
                    staff: true,
                    rooms: true,
                    appointments: true,
                },
            },
        },
    });

    if (!clinic) {
        throw new Error('CLINIC_NOT_FOUND');
    }

    // Get operations stats
    const opsStats = await clinicOperationsService.getClinicDashboard(clinic.id);
    const roomDetails = await clinicOperationsService.getRoomAvailability(clinic.id);

    return {
        profile: {
            id: clinic.id,
            name: clinic.name,
            logoUrl: clinic.logoUrl,
            verificationStatus: clinic.verificationStatus,
            emergencyMode: clinic.emergencyMode,
        },
        stats: {
            ...opsStats,
            roomDetails,
            totalDoctors: clinic._count.doctors,
            totalStaff: clinic._count.staff,
            totalRooms: clinic._count.rooms,
            totalAppointments: clinic._count.appointments,
        },
    };
}

// ============================================
// STAFF MANAGEMENT
// ============================================

interface StaffInput {
    clinicId: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
    phone?: string;
    password?: string;
}

export async function getClinicStaff(clinicId: string) {
    return prisma.clinicStaff.findMany({
        where: { clinicId, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getStaffMemberById(id: string, clinicId: string) {
    const staff = await prisma.clinicStaff.findFirst({
        where: { id, clinicId },
    });
    if (!staff) throw new Error('STAFF_NOT_FOUND');
    return staff;
}

export async function addStaffMember(input: StaffInput) {
    let userId: string | undefined;

    if (input.email) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

        if (existingUser) {
            userId = existingUser.id;
            // Optionally update password if provided? Probably better not to overwrite without prompt
        } else {
            // Create a new User account for the staff member
            // Default password is their email if none provided
            const passToHash = input.password || input.email;
            const passwordHash = await bcrypt.hash(passToHash, config.BCRYPT_ROUNDS);
            const user = await prisma.user.create({
                data: {
                    email: input.email,
                    phone: input.phone,
                    passwordHash,
                    role: 'STAFF',
                    status: UserStatus.ACTIVE, // Staff created by admin are active
                    emailVerified: true,
                },
            });
            userId = user.id;
        }
    }

    const { password, ...staffData } = input;

    return prisma.clinicStaff.create({
        data: {
            ...staffData,
            userId,
            role: input.role as StaffRole
        }
    });
}

export async function updateStaff(id: string, clinicId: string, data: Partial<StaffInput>) {
    const staff = await prisma.clinicStaff.findFirst({ where: { id, clinicId } });
    if (!staff) throw new Error('STAFF_NOT_FOUND');
    return prisma.clinicStaff.update({ where: { id }, data: data as any });
}

export async function removeStaff(id: string, clinicId: string) {
    const staff = await prisma.clinicStaff.findFirst({ where: { id, clinicId } });
    if (!staff) throw new Error('STAFF_NOT_FOUND');
    await prisma.clinicStaff.update({ where: { id }, data: { isActive: false } });
    return { success: true };
}

// ============================================
// ROOM MANAGEMENT
// ============================================

interface RoomInput {
    clinicId: string;
    name: string;
    type: string;
}

export async function getRooms(clinicId: string) {
    return prisma.room.findMany({
        where: { clinicId, isActive: true },
        orderBy: { name: 'asc' },
    });
}

export async function addRoom(input: RoomInput) {
    return prisma.room.create({ data: input as any });
}

export async function updateRoom(id: string, clinicId: string, data: Partial<RoomInput>) {
    const room = await prisma.room.findFirst({ where: { id, clinicId } });
    if (!room) throw new Error('ROOM_NOT_FOUND');
    return prisma.room.update({ where: { id }, data: data as any });
}

export async function removeRoom(id: string, clinicId: string) {
    const room = await prisma.room.findFirst({ where: { id, clinicId } });
    if (!room) throw new Error('ROOM_NOT_FOUND');
    await prisma.room.update({ where: { id }, data: { isActive: false } });
    return { success: true };
}

// ============================================
// WORKING HOURS
// ============================================

interface WorkingHoursInput {
    clinicId: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export async function getWorkingHours(clinicId: string) {
    return prisma.workingHours.findMany({
        where: { clinicId },
        orderBy: { dayOfWeek: 'asc' },
    });
}

export async function setWorkingHours(input: WorkingHoursInput[]) {
    // Upsert all hours
    return Promise.all(
        input.map((hours) =>
            prisma.workingHours.upsert({
                where: {
                    clinicId_dayOfWeek: {
                        clinicId: hours.clinicId,
                        dayOfWeek: hours.dayOfWeek,
                    },
                },
                create: hours,
                update: {
                    openTime: hours.openTime,
                    closeTime: hours.closeTime,
                    isClosed: hours.isClosed,
                },
            })
        )
    );
}

// ============================================
// DOCTOR AFFILIATION
// ============================================

export async function getAffiliatedDoctors(clinicId: string) {
    return prisma.clinicDoctor.findMany({
        where: { clinicId, status: 'ACTIVE' },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    specialties: { include: { specialty: true } },
                    availabilities: {
                        where: { clinicId },
                        select: {
                            id: true,
                            dayOfWeek: true,
                            startTime: true,
                            endTime: true,
                            slotDuration: true,
                        }
                    }
                },
            },
        },
        orderBy: { joinedAt: 'desc' },
    });
}

export async function addDoctorAffiliation(clinicId: string, doctorId: string) {
    // Check if already affiliated
    const existing = await prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId, doctorId } },
    });

    if (existing) {
        if (existing.status === 'ACTIVE') {
            throw new Error('DOCTOR_ALREADY_AFFILIATED');
        }
        // Reactivate
        return prisma.clinicDoctor.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', leftAt: null },
        });
    }

    return prisma.clinicDoctor.create({
        data: { clinicId, doctorId, status: 'ACTIVE' },
        include: {
            doctor: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
}

export async function removeDoctorAffiliation(clinicId: string, doctorId: string) {
    const affiliation = await prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId, doctorId } },
    });

    if (!affiliation) throw new Error('AFFILIATION_NOT_FOUND');

    await prisma.clinicDoctor.update({
        where: { id: affiliation.id },
        data: { status: 'INACTIVE', leftAt: new Date() },
    });

    return { success: true };
}

// ============================================
// APPOINTMENTS
// ============================================

export async function getClinicAppointments(
    clinicId: string,
    filters?: { status?: string; date?: string; doctorId?: string }
) {
    const where: any = { clinicId };

    if (filters?.status) {
        where.status = filters.status;
    }

    if (filters?.doctorId) {
        where.doctorId = filters.doctorId;
    }

    if (filters?.date) {
        const date = new Date(filters.date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        where.scheduledDate = {
            gte: date,
            lt: nextDay,
        };
    }

    return prisma.appointment.findMany({
        where,
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
            service: true,
        },
        orderBy: { scheduledDate: 'desc' },
    });
}

// ============================================
// PUBLIC SEARCH & PROFILE
// ============================================

export async function searchClinics(query: string) {
    return prisma.clinic.findMany({
        where: {
            verificationStatus: 'APPROVED',
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            address: true,
            city: true,
            verificationStatus: true,
            logoUrl: true,
        },
        take: 20,
    });
}

export async function getPublicClinicProfile(id: string) {
    const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: {
            workingHours: true,
            doctors: {
                where: { status: 'ACTIVE' },
                include: {
                    doctor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            specialties: { include: { specialty: true } },
                            avatarUrl: true,
                            averageRating: true,
                            totalReviews: true,
                        },
                    },
                },
            },
        },
    });

    if (!clinic) throw new Error('CLINIC_NOT_FOUND');
    return clinic;
}

import { prisma } from '@/lib/prisma';

interface AvailabilityInput {
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    clinicId?: string;
}

interface ExceptionInput {
    doctorId: string;
    date: Date;
    isBlocked?: boolean;
    reason?: string;
    startTime?: string;
    endTime?: string;
}

interface SlotResult {
    time: string;
    available: boolean;
}

// ============================================
// AVAILABILITY MANAGEMENT
// ============================================

export async function getAvailability(doctorId: string, clinicId?: string) {
    const where: any = { doctorId, isActive: true };
    if (clinicId) where.clinicId = clinicId;

    return prisma.availability.findMany({
        where,
        orderBy: { dayOfWeek: 'asc' },
        include: { clinic: { select: { id: true, name: true } } },
    });
}

export async function setAvailability(input: AvailabilityInput) {
    const { doctorId, dayOfWeek, clinicId, ...data } = input;

    // Find existing availability for this day (with or without clinic)
    const existing = await prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek,
            clinicId: clinicId || null,
        },
    });

    if (existing) {
        // Update existing
        return prisma.availability.update({
            where: { id: existing.id },
            data: { ...data, isActive: true },
        });
    }

    // Create new
    return prisma.availability.create({
        data: {
            doctorId,
            dayOfWeek,
            clinicId: clinicId || null,
            ...data,
        },
    });
}

export async function updateAvailability(id: string, doctorId: string, data: Partial<AvailabilityInput>) {
    const existing = await prisma.availability.findFirst({ where: { id, doctorId } });
    if (!existing) throw new Error('AVAILABILITY_NOT_FOUND');

    return prisma.availability.update({ where: { id }, data });
}

export async function removeAvailability(id: string, doctorId: string) {
    const existing = await prisma.availability.findFirst({ where: { id, doctorId } });
    if (!existing) throw new Error('AVAILABILITY_NOT_FOUND');

    await prisma.availability.update({ where: { id }, data: { isActive: false } });
    return { success: true };
}

// ============================================
// EXCEPTION MANAGEMENT
// ============================================

export async function getExceptions(doctorId: string, fromDate?: Date) {
    const where: any = { doctorId };
    if (fromDate) where.date = { gte: fromDate };

    return prisma.availabilityException.findMany({
        where,
        orderBy: { date: 'asc' },
    });
}

export async function addException(input: ExceptionInput) {
    return prisma.availabilityException.create({ data: input });
}

export async function removeException(id: string, doctorId: string) {
    const existing = await prisma.availabilityException.findFirst({ where: { id, doctorId } });
    if (!existing) throw new Error('EXCEPTION_NOT_FOUND');

    await prisma.availabilityException.delete({ where: { id } });
    return { success: true };
}

// ============================================
// SLOT GENERATION
// ============================================

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function generateSlots(
    doctorId: string,
    date: Date,
    clinicId?: string
): Promise<SlotResult[]> {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // 1. Get availability rules for this day
    const where: any = { doctorId, dayOfWeek, isActive: true };
    if (clinicId) where.clinicId = clinicId;

    const availabilities = await prisma.availability.findMany({ where });

    if (availabilities.length === 0) {
        return [];
    }

    // 2. Generate base slots
    const slots: SlotResult[] = [];

    for (const avail of availabilities) {
        const startMins = timeToMinutes(avail.startTime);
        const endMins = timeToMinutes(avail.endTime);
        const duration = avail.slotDuration;

        for (let mins = startMins; mins + duration <= endMins; mins += duration) {
            slots.push({
                time: minutesToTime(mins),
                available: true,
            });
        }
    }

    // 3. Check for exceptions on this date
    const exceptions = await prisma.availabilityException.findMany({
        where: {
            doctorId,
            date: {
                gte: new Date(dateStr),
                lt: new Date(new Date(dateStr).getTime() + 86400000),
            },
        },
    });

    for (const exc of exceptions) {
        if (exc.isBlocked && !exc.startTime && !exc.endTime) {
            // Full day blocked
            return [];
        }

        if (exc.isBlocked && exc.startTime && exc.endTime) {
            // Partial block
            const blockStart = timeToMinutes(exc.startTime);
            const blockEnd = timeToMinutes(exc.endTime);

            for (const slot of slots) {
                const slotMins = timeToMinutes(slot.time);
                if (slotMins >= blockStart && slotMins < blockEnd) {
                    slot.available = false;
                }
            }
        }
    }

    // 4. Check existing appointments
    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(new Date(dateStr).getTime() + 86400000);

    const appointments = await prisma.appointment.findMany({
        where: {
            doctorId,
            scheduledDate: { gte: startOfDay, lt: endOfDay },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { scheduledTime: true },
    });

    const bookedTimes = new Set(appointments.map((a) => a.scheduledTime));

    for (const slot of slots) {
        if (bookedTimes.has(slot.time)) {
            slot.available = false;
        }
    }

    return slots;
}

// ============================================
// PUBLIC DOCTOR SEARCH
// ============================================

interface SearchDoctorsInput {
    specialtyId?: string;
    city?: string;
    name?: string;
    page?: number;
    limit?: number;
}

export async function searchDoctors(input: SearchDoctorsInput) {
    const { specialtyId, city, name, page = 1, limit = 20 } = input;
    const skip = (page - 1) * limit;

    const where: any = {
        verificationStatus: 'APPROVED',
    };

    if (specialtyId) {
        where.specialties = { some: { specialtyId } };
    }

    if (name) {
        where.OR = [
            { firstName: { contains: name, mode: 'insensitive' } },
            { lastName: { contains: name, mode: 'insensitive' } },
        ];
    }

    if (city) {
        where.clinicAffiliations = {
            some: {
                status: 'ACTIVE',
                clinic: {
                    city: { contains: city, mode: 'insensitive' }
                }
            }
        };
    }

    const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
            where,
            skip,
            take: limit,
            include: {
                specialties: { include: { specialty: true } },
                clinicAffiliations: {
                    where: { status: 'ACTIVE' },
                    include: { clinic: { select: { id: true, name: true, city: true } } },
                },
            },
            orderBy: [{ averageRating: 'desc' }, { totalReviews: 'desc' }],
        }),
        prisma.doctor.count({ where }),
    ]);

    return {
        doctors: doctors.map((d) => ({
            id: d.id,
            firstName: d.firstName,
            lastName: d.lastName,
            avatarUrl: d.avatarUrl,
            bio: d.bio,
            consultationFee: d.consultationFee,
            averageRating: d.averageRating,
            totalReviews: d.totalReviews,
            specialties: d.specialties.map((s) => s.specialty),
            clinics: d.clinicAffiliations.map((c) => c.clinic),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getPublicDoctorProfile(doctorId: string) {
    const doctor = await prisma.doctor.findFirst({
        where: { id: doctorId, verificationStatus: 'APPROVED' },
        include: {
            specialties: { include: { specialty: true } },
            education: true,
            reviews: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: { select: { firstName: true, lastName: true } },
                },
            },
            clinicAffiliations: {
                where: { status: 'ACTIVE' },
                include: {
                    clinic: {
                        select: { id: true, name: true, city: true, address: true },
                    },
                },
            },
        },
    });

    if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

    return {
        id: doctor.id,
        userId: doctor.userId,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        title: doctor.title,
        avatarUrl: doctor.avatarUrl,
        bio: doctor.bio,
        yearsExperience: doctor.yearsExperience,
        consultationFee: doctor.consultationFee,
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews,
        teleconsultEnabled: doctor.teleconsultEnabled,
        specialties: doctor.specialties.map((s) => s.specialty),
        education: doctor.education,
        clinics: doctor.clinicAffiliations.map((c) => c.clinic),
        recentReviews: doctor.reviews,
    };
}

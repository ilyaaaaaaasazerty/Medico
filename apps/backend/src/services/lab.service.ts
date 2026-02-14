import { prisma } from '../lib/prisma.js';
import { LabType, LabRole, TestCategory } from '@prisma/client';

interface RegisterLabInput {
    userId: string;
    name: string;
    type: LabType;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    homeCollection?: boolean;
}

interface UpdateLabInput {
    name?: string;
    type?: LabType;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    description?: string;
    logoUrl?: string;
    latitude?: number;
    longitude?: number;
    homeCollection?: boolean;
}

/**
 * Register new lab center
 */
export async function registerLabCenter(input: RegisterLabInput) {
    // Check if admin already has a lab
    const existing = await prisma.labAdmin.findUnique({
        where: { userId: input.userId },
        include: { labCenter: true },
    });

    if (existing) {
        throw new Error('LAB_EXISTS');
    }

    // Create lab and admin
    const lab = await prisma.labCenter.create({
        data: {
            name: input.name,
            type: input.type,
            email: input.email,
            phone: input.phone,
            address: input.address,
            city: input.city,
            state: input.state,
            country: input.country,
            description: input.description,
            latitude: input.latitude,
            longitude: input.longitude,
            homeCollection: input.homeCollection || false,
            verificationStatus: 'PENDING',
            admins: {
                create: {
                    userId: input.userId,
                    role: LabRole.OWNER,
                },
            },
        },
        include: {
            admins: { include: { user: { select: { email: true, phone: true } } } },
        },
    });

    return lab;
}

/**
 * Get lab by user ID
 */
export async function getLabByUserId(userId: string) {
    const admin = await prisma.labAdmin.findUnique({
        where: { userId },
        include: {
            labCenter: {
                include: {
                    admins: { include: { user: { select: { email: true, phone: true, role: true } } } },
                    technicians: true,
                    tests: true,
                    equipment: true,
                    workingHours: true,
                },
            },
        },
    });

    if (!admin) {
        throw new Error('LAB_NOT_FOUND');
    }

    return admin.labCenter;
}

/**
 * Update lab profile
 */
export async function updateLab(userId: string, input: UpdateLabInput) {
    const admin = await prisma.labAdmin.findUnique({
        where: { userId },
        select: { labCenterId: true },
    });

    if (!admin) {
        throw new Error('LAB_NOT_FOUND');
    }

    return prisma.labCenter.update({
        where: { id: admin.labCenterId },
        data: input,
    });
}

/**
 * Check if lab profile exists
 */
export async function labProfileExists(userId: string): Promise<boolean> {
    const admin = await prisma.labAdmin.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!admin;
}

/**
 * Get lab dashboard
 */
export async function getLabDashboard(userId: string) {
    const admin = await prisma.labAdmin.findUnique({
        where: { userId },
        include: {
            labCenter: {
                include: {
                    _count: {
                        select: {
                            technicians: true,
                            tests: true,
                            equipment: true,
                            requests: true,
                        },
                    },
                },
            },
        },
    });

    if (!admin) {
        throw new Error('LAB_NOT_FOUND');
    }

    return {
        profile: {
            id: admin.labCenter.id,
            name: admin.labCenter.name,
            type: admin.labCenter.type,
            logoUrl: admin.labCenter.logoUrl,
            verificationStatus: admin.labCenter.verificationStatus,
            homeCollection: admin.labCenter.homeCollection,
        },
        stats: {
            totalTests: admin.labCenter._count.tests,
            totalTechnicians: admin.labCenter._count.technicians,
            totalEquipment: admin.labCenter._count.equipment,
            totalRequests: admin.labCenter._count.requests,
        },
    };
}

// ============================================
// TEST MANAGEMENT
// ============================================

interface LabTestInput {
    labCenterId: string;
    name: string;
    category: string;
    creditCost: number;
    description?: string;
    preparation?: string;
    turnaroundHours?: number;
}

export async function getLabTests(labCenterId: string) {
    return prisma.labTest.findMany({
        where: { labCenterId, isActive: true },
        orderBy: { name: 'asc' },
    });
}

export async function addLabTest(input: LabTestInput) {
    return prisma.labTest.create({
        data: {
            ...input,
            category: input.category as TestCategory
        }
    });
}

export async function updateLabTest(id: string, labCenterId: string, data: Partial<LabTestInput>) {
    const test = await prisma.labTest.findFirst({ where: { id, labCenterId } });
    if (!test) throw new Error('TEST_NOT_FOUND');

    // Remove id and labCenterId from data if they exist
    const { labCenterId: _, ...updateData } = data;

    return prisma.labTest.update({
        where: { id },
        data: {
            ...updateData,
            category: updateData.category ? (updateData.category as TestCategory) : undefined
        }
    });
}

export async function removeLabTest(id: string, labCenterId: string) {
    const test = await prisma.labTest.findFirst({ where: { id, labCenterId } });
    if (!test) throw new Error('TEST_NOT_FOUND');
    await prisma.labTest.update({ where: { id }, data: { isActive: false } });
    return { success: true };
}

// ============================================
// TECHNICIAN MANAGEMENT
// ============================================

interface TechnicianInput {
    labCenterId: string;
    firstName: string;
    lastName: string;
    qualification: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
}

export async function getTechnicians(labCenterId: string) {
    return prisma.labTechnician.findMany({
        where: { labCenterId, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function addTechnician(input: TechnicianInput) {
    return prisma.labTechnician.create({ data: input });
}

export async function updateTechnician(id: string, labCenterId: string, data: Partial<TechnicianInput>) {
    const tech = await prisma.labTechnician.findFirst({ where: { id, labCenterId } });
    if (!tech) throw new Error('TECHNICIAN_NOT_FOUND');
    return prisma.labTechnician.update({ where: { id }, data });
}

export async function removeTechnician(id: string, labCenterId: string) {
    const tech = await prisma.labTechnician.findFirst({ where: { id, labCenterId } });
    if (!tech) throw new Error('TECHNICIAN_NOT_FOUND');
    await prisma.labTechnician.update({ where: { id }, data: { isActive: false } });
    return { success: true };
}

// ============================================
// EQUIPMENT MANAGEMENT
// ============================================

interface EquipmentInput {
    labCenterId: string;
    name: string;
    type: string;
    isOperational?: boolean;
    nextMaintenance?: Date;
}

export async function getEquipment(labCenterId: string) {
    return prisma.labEquipment.findMany({
        where: { labCenterId },
        orderBy: { name: 'asc' },
    });
}

export async function addEquipment(input: EquipmentInput) {
    return prisma.labEquipment.create({ data: input });
}

export async function removeEquipment(id: string, labCenterId: string) {
    const equipment = await prisma.labEquipment.findFirst({ where: { id, labCenterId } });
    if (!equipment) throw new Error('EQUIPMENT_NOT_FOUND');
    await prisma.labEquipment.delete({ where: { id } });
    return { success: true };
}

// ============================================
// WORKING HOURS
// ============================================

interface LabWorkingHoursInput {
    labCenterId: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export async function getLabWorkingHours(labCenterId: string) {
    return prisma.labWorkingHours.findMany({
        where: { labCenterId },
        orderBy: { dayOfWeek: 'asc' },
    });
}

export async function setLabWorkingHours(input: LabWorkingHoursInput[]) {
    return Promise.all(
        input.map((hours) =>
            prisma.labWorkingHours.upsert({
                where: {
                    labCenterId_dayOfWeek: {
                        labCenterId: hours.labCenterId,
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
// PUBLIC SEARCH & PROFILE
// ============================================

export async function searchLabs(query: string) {
    return prisma.labCenter.findMany({
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
            homeCollection: true,
            type: true,
        },
        take: 20,
    });
}

export async function getPublicLabProfile(id: string) {
    const lab = await prisma.labCenter.findUnique({
        where: { id },
        include: {
            workingHours: true,
            tests: { where: { isActive: true } },
        },
    });

    if (!lab) throw new Error('LAB_NOT_FOUND');
    return lab;
}

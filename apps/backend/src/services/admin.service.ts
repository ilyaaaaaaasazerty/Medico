import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { VerificationStatus, Role, PayoutStatus, ClinicRole, LabRole, UserStatus } from '@prisma/client';
import { BadRequest, NotFound } from '../middleware/errorHandler.js';

export const adminService = {
    // --- DASHBOARD STATS ---
    getDashboardStats: async () => {
        const [
            totalPatients,
            totalDoctors,
            totalClinics,
            totalLabs,
            pendingVerifications,
            revenue
        ] = await Promise.all([
            prisma.user.count({ where: { role: Role.PATIENT } }),
            prisma.user.count({ where: { role: Role.DOCTOR } }),
            prisma.user.count({ where: { role: Role.CLINIC_ADMIN } }),
            prisma.user.count({ where: { role: Role.LAB_ADMIN } }),
            prisma.verificationRequest.count({ where: { status: VerificationStatus.PENDING } }),
            prisma.payout.aggregate({ _sum: { amount: true }, where: { status: PayoutStatus.PAID } })
        ]);

        return {
            users: {
                patients: totalPatients,
                doctors: totalDoctors,
                clinics: totalClinics,
                labs: totalLabs
            },
            tasks: { pendingVerifications },
            finance: { totalPayouts: revenue._sum.amount || 0 }
        };
    },

    // --- VERIFICATION ---
    getPendingVerifications: async () => {
        return prisma.verificationRequest.findMany({
            where: { status: VerificationStatus.PENDING },
            orderBy: { createdAt: 'desc' }
        });
    },

    verifyProvider: async (requestId: string, status: VerificationStatus, notes?: string, adminId?: string) => {
        const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
        if (!request) throw NotFound('Verification request not found');

        if (status === VerificationStatus.APPROVED) {
            // Update target provider status
            if (request.type === 'DOCTOR') {
                await prisma.doctor.update({
                    where: { id: request.targetId },
                    data: { verificationStatus: VerificationStatus.APPROVED }
                });
                // Also activate user?
            } else if (request.type === 'CLINIC') {
                await prisma.clinic.update({
                    where: { id: request.targetId },
                    data: { verificationStatus: VerificationStatus.APPROVED }
                });
            } else if (request.type === 'LAB') {
                await prisma.labCenter.update({
                    where: { id: request.targetId },
                    data: {
                        verificationStatus: VerificationStatus.APPROVED,
                        verifiedAt: new Date()
                    }
                });
            }
        } else if (status === VerificationStatus.REJECTED) {
            if (request.type === 'DOCTOR') {
                await prisma.doctor.update({
                    where: { id: request.targetId },
                    data: { verificationStatus: VerificationStatus.REJECTED }
                });
            }
            // ... handle others
        }

        return prisma.verificationRequest.update({
            where: { id: requestId },
            data: {
                status,
                notes,
                reviewedBy: adminId,
                reviewedAt: new Date()
            }
        });
    },

    // --- STAFF ---
    createStaff: async (userId: string, data: { firstName: string, lastName: string, position: string, department: string }) => {
        // Ensure user exists and upgrade role?
        // This logic assumes user is already created as STAFF role or similar.
        return prisma.staff.create({
            data: {
                userId,
                firstName: data.firstName,
                lastName: data.lastName,
                position: data.position,
                department: data.department
            }
        });
    },

    // --- PROVIDER CREATION ---
    createProvider: async (data: any) => {
        const { type, email, password, details } = data;

        // 1. Create User
        const hashedPassword = await bcrypt.hash(password, 10);

        const role = type === 'DOCTOR' ? Role.DOCTOR :
            type === 'CLINIC' ? Role.CLINIC_ADMIN :
                type === 'LAB' ? Role.LAB_ADMIN : null;

        if (!role) throw BadRequest('Invalid provider type');

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) throw BadRequest('User with this email already exists');

        return prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: role,
                    emailVerified: true,
                    status: 'ACTIVE'
                }
            });

            // 2. Create Profile
            if (type === 'DOCTOR') {
                const doctor = await tx.doctor.create({
                    data: {
                        userId: user.id,
                        firstName: details.firstName,
                        lastName: details.lastName,
                        licenseNumber: details.licenseNumber,
                        licenseExpiry: new Date(details.licenseExpiry),
                        verificationStatus: VerificationStatus.APPROVED,
                        verifiedAt: new Date()
                    }
                });

                // Create Specialty link if ID provided
                if (details.specialtyId) {
                    await tx.doctorSpecialty.create({
                        data: {
                            doctorId: doctor.id,
                            specialtyId: details.specialtyId,
                            isPrimary: true
                        }
                    });
                }
            } else if (type === 'CLINIC') {
                const clinic = await tx.clinic.create({
                    data: {
                        name: details.name,
                        address: details.address || 'Algiers',
                        city: details.city || 'Algiers',
                        state: details.state || 'Algiers',
                        country: 'Algeria',
                        postalCode: details.postalCode || '16000',
                        email: email,
                        phone: details.phone || '',
                        verificationStatus: VerificationStatus.APPROVED,
                        verifiedAt: new Date()
                    }
                });
                // Create ClinicAdmin link
                await tx.clinicAdmin.create({
                    data: {
                        userId: user.id,
                        clinicId: clinic.id,
                        role: ClinicRole.OWNER
                    }
                });
            } else if (type === 'LAB') {
                const lab = await tx.labCenter.create({
                    data: {
                        name: details.name,
                        type: details.labType || 'BOTH',
                        address: details.address || 'Algiers',
                        city: details.city || 'Algiers',
                        state: details.state || 'Algiers',
                        country: 'Algeria',
                        email: email,
                        phone: details.phone || '',
                        verificationStatus: VerificationStatus.APPROVED,
                        verifiedAt: new Date()
                    }
                });
                await tx.labAdmin.create({
                    data: {
                        userId: user.id,
                        labCenterId: lab.id,
                        role: LabRole.OWNER
                    }
                });
            }

            return user;
        });
    },

    // --- PAYOUTS (Basic) --- 
    getPayouts: async (status?: any) => {
        return prisma.payout.findMany({
            where: status ? { status } : undefined,
            include: {
                user: {
                    include: {
                        doctor: true,
                        clinicAdmin: { include: { clinic: true } },
                        labAdmin: { include: { labCenter: true } }
                    }
                }
            },
            orderBy: { requestedAt: 'desc' },
            take: 50
        });
    },

    // --- USER MANAGEMENT ---
    listPatients: async (search?: string, status?: string) => {
        return prisma.patient.findMany({
            where: {
                OR: search ? [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ] : undefined,
                user: status ? { status: status as any } : undefined
            },
            include: { user: { select: { email: true, status: true, lastLoginAt: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    listDoctors: async (search?: string, verificationStatus?: VerificationStatus) => {
        return prisma.doctor.findMany({
            where: {
                OR: search ? [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ] : undefined,
                verificationStatus: verificationStatus
            },
            include: { user: { select: { email: true, status: true, lastLoginAt: true } }, specialties: { include: { specialty: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    listClinics: async (search?: string, status?: VerificationStatus) => {
        return prisma.clinic.findMany({
            where: {
                OR: search ? [
                    { name: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ] : undefined,
                verificationStatus: status
            },
            include: {
                admins: { include: { user: { select: { email: true, status: true, lastLoginAt: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    listLabs: async (search?: string, status?: VerificationStatus) => {
        return prisma.labCenter.findMany({
            where: {
                OR: search ? [
                    { name: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ] : undefined,
                verificationStatus: status
            },
            include: {
                admins: { include: { user: { select: { email: true, status: true, lastLoginAt: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    listTransportProviders: async (search?: string) => {
        return prisma.transportProvider.findMany({
            where: {
                companyName: search ? { contains: search, mode: 'insensitive' } : undefined
            },
            include: { user: { select: { email: true, status: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    toggleUserStatus: async (userId: string, status: UserStatus) => {
        return prisma.user.update({
            where: { id: userId },
            data: { status }
        });
    },

    // --- SYSTEM CONFIG & FLAGS ---
    getFeatureFlags: async () => {
        return prisma.featureFlag.findMany();
    },

    updateFeatureFlag: async (key: string, enabled: boolean) => {
        return prisma.featureFlag.upsert({
            where: { key },
            update: { enabled },
            create: { key, enabled }
        });
    },

    // --- SPECIALITIES ---
    listSpecialties: async () => {
        return prisma.specialty.findMany({ orderBy: { name: 'asc' } });
    }
};

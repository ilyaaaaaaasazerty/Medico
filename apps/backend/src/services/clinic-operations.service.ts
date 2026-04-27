import { prisma } from '../lib/prisma.js';
import { WaitlistStatus, ServiceCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

// ============================================
// CLINIC SERVICES MANAGEMENT
// ============================================

export const clinicOperationsService = {
    // Get all service types for a clinic
    async getClinicServices(clinicId: string) {
        return prisma.clinicServiceType.findMany({
            where: { clinicId, isActive: true },
            orderBy: { category: 'asc' },
        });
    },

    // Get services grouped by category
    async getClinicServicesByCategory(clinicId: string) {
        const services = await prisma.clinicServiceType.findMany({
            where: { clinicId, isActive: true },
            orderBy: { name: 'asc' },
        });

        // Group by category
        const grouped: Record<ServiceCategory, typeof services> = {
            PRIMARY_CARE: [],
            DIAGNOSTIC: [],
            SPECIALIST: [],
            THERAPEUTIC: [],
            EMERGENCY: [],
        };

        services.forEach((service) => {
            grouped[service.category].push(service);
        });

        return grouped;
    },

    // Create a new service type
    async createClinicService(
        clinicId: string,
        data: {
            name: string;
            category: ServiceCategory;
            description?: string;
            duration: number;
            price: number;
        }
    ) {
        return prisma.clinicServiceType.create({
            data: {
                clinicId,
                ...data,
            },
        });
    },

    // Update a service type
    async updateClinicService(
        serviceId: string,
        data: Partial<{
            name: string;
            category: ServiceCategory;
            description: string;
            duration: number;
            price: number;
            isActive: boolean;
        }>
    ) {
        return prisma.clinicServiceType.update({
            where: { id: serviceId },
            data,
        });
    },

    // Delete (soft) a service type
    async deleteClinicService(serviceId: string) {
        return prisma.clinicServiceType.update({
            where: { id: serviceId },
            data: { isActive: false },
        });
    },

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

    // Patient check-in
    async checkInPatient(appointmentId: string) {
        // Get appointment
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { clinic: true },
        });

        if (!appointment) {
            throw new Error('APPOINTMENT_NOT_FOUND');
        }

        if (appointment.status !== 'CONFIRMED') {
            throw new Error('NOT_CONFIRMED');
        }

        // Check if already checked in
        const existingEntry = await prisma.waitlistEntry.findUnique({
            where: { appointmentId },
        });

        if (existingEntry) {
            throw new Error('ALREADY_CHECKED_IN');
        }

        // Calculate queue position
        const checkedInCount = await prisma.waitlistEntry.count({
            where: {
                clinicId: appointment.clinicId!,
                checkedInAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
                status: { in: ['WAITING', 'CALLED', 'WITH_NURSE'] },
            },
        });

        const queuePosition = checkedInCount + 1;
        const estimatedWait = (queuePosition - 1) * 15; // 15 min average

        // Update appointment and create waitlist entry
        const [updatedAppointment, waitlistEntry] = await prisma.$transaction([
            prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: 'CHECKED_IN',
                    checkInTime: new Date(),
                },
            }),
            prisma.waitlistEntry.create({
                data: {
                    clinicId: appointment.clinicId!,
                    appointmentId,
                    queuePosition,
                    status: WaitlistStatus.WAITING,
                },
            }),
        ]);

        return {
            appointment: updatedAppointment,
            waitlistEntry,
            queuePosition,
            estimatedWaitMinutes: estimatedWait,
        };
    },

    // Get clinic queue for today
    async getClinicQueue(clinicId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return prisma.waitlistEntry.findMany({
            where: {
                clinicId,
                checkedInAt: { gte: today },
                status: { notIn: [WaitlistStatus.COMPLETED, WaitlistStatus.NO_SHOW] },
            },
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: true,
                        service: true,
                    },
                },
            },
            orderBy: { queuePosition: 'asc' },
        });
    },

    // Update queue status
    async updateQueueStatus(waitlistId: string, status: WaitlistStatus) {
        const updateData: any = { status };

        if (status === WaitlistStatus.CALLED) {
            updateData.calledAt = new Date();
        }

        return prisma.waitlistEntry.update({
            where: { id: waitlistId },
            data: updateData,
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: true,
                    },
                },
            },
        });
    },

    // ============================================
    // VITALS RECORDING
    // ============================================

    async recordVitals(
        appointmentId: string,
        _recordedBy: string,
        vitals: {
            bloodPressureSystolic?: number;
            bloodPressureDiastolic?: number;
            heartRate?: number;
            temperature?: number;
            weight?: number;
            height?: number;
            oxygenSaturation?: number;
        }
    ) {
        const vitalEntries: { type: string; value: number; unit: string }[] = [
            vitals.bloodPressureSystolic !== undefined && { type: 'BLOOD_PRESSURE_SYSTOLIC', value: vitals.bloodPressureSystolic, unit: 'mmHg' },
            vitals.bloodPressureDiastolic !== undefined && { type: 'BLOOD_PRESSURE_DIASTOLIC', value: vitals.bloodPressureDiastolic, unit: 'mmHg' },
            vitals.heartRate !== undefined && { type: 'HEART_RATE', value: vitals.heartRate, unit: 'bpm' },
            vitals.temperature !== undefined && { type: 'TEMPERATURE', value: vitals.temperature, unit: '°C' },
            vitals.weight !== undefined && { type: 'WEIGHT', value: vitals.weight, unit: 'kg' },
            vitals.height !== undefined && { type: 'HEIGHT', value: vitals.height, unit: 'cm' },
            vitals.oxygenSaturation !== undefined && { type: 'OXYGEN_SATURATION', value: vitals.oxygenSaturation, unit: '%' },
        ].filter(Boolean) as { type: string; value: number; unit: string }[];

        if (vitalEntries.length === 0) {
            throw new Error('NO_VITALS_PROVIDED');
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true }
        });
        if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

        const recordings = await prisma.$transaction(
            vitalEntries.map(entry =>
                prisma.vitalRecording.create({
                    data: {
                        appointmentId,
                        patientId: appointment.patientId,
                        type: entry.type as any,
                        value: entry.value,
                        unit: entry.unit,
                        recordedAt: new Date(),
                    },
                })
            )
        );

        await prisma.waitlistEntry.updateMany({
            where: { appointmentId },
            data: { status: WaitlistStatus.WITH_NURSE },
        });

        return recordings;
    },

    // Get vitals for an appointment
    async getAppointmentVitals(appointmentId: string) {
        return prisma.vitalRecording.findMany({
            where: { appointmentId },
            orderBy: { recordedAt: 'desc' },
        });
    },

    // ============================================
    // ROOM MANAGEMENT
    // ============================================

    async assignRoom(appointmentId: string, roomId: string) {
        // Check room is available
        const activeAssignment = await prisma.roomAssignment.findFirst({
            where: {
                roomId,
                releasedAt: null,
            },
        });

        if (activeAssignment) {
            throw new Error('ROOM_OCCUPIED');
        }

        // Create assignment
        const assignment = await prisma.roomAssignment.create({
            data: {
                roomId,
                appointmentId,
            },
            include: {
                room: true,
                appointment: {
                    include: {
                        patient: true,
                        doctor: true,
                    },
                },
            },
        });

        // Update waitlist status
        await prisma.waitlistEntry.updateMany({
            where: { appointmentId },
            data: { status: WaitlistStatus.WITH_DOCTOR },
        });

        return assignment;
    },

    async releaseRoom(assignmentId: string) {
        return prisma.roomAssignment.update({
            where: { id: assignmentId },
            data: { releasedAt: new Date() },
        });
    },

    // Get room availability
    async getRoomAvailability(clinicId: string) {
        const rooms = await prisma.room.findMany({
            where: { clinicId, isActive: true },
            include: {
                roomAssignments: {
                    where: { releasedAt: null },
                    include: {
                        appointment: {
                            include: {
                                patient: true,
                                doctor: true,
                            },
                        },
                    },
                },
            },
        });

        return rooms.map((room) => ({
            ...room,
            isOccupied: room.roomAssignments.length > 0,
            currentAssignment: room.roomAssignments[0] || null,
        }));
    },

    // ============================================
    // CLINIC DASHBOARD
    // ============================================

    async getClinicDashboard(clinicId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's appointments by status
        const appointmentsByStatus = await prisma.appointment.groupBy({
            by: ['status'],
            where: {
                clinicId,
                scheduledDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _count: true,
        });

        // Get queue metrics
        const queueCount = await prisma.waitlistEntry.count({
            where: {
                clinicId,
                checkedInAt: { gte: today },
                status: { in: [WaitlistStatus.WAITING, WaitlistStatus.CALLED, WaitlistStatus.WITH_NURSE] },
            },
        });

        // Get room availability
        const rooms = await prisma.room.findMany({
            where: { clinicId, isActive: true },
        });

        const occupiedRooms = await prisma.roomAssignment.count({
            where: {
                room: { clinicId },
                releasedAt: null,
            },
        });

        // Get active doctors today
        const activeDoctors = await prisma.appointment.findMany({
            where: {
                clinicId,
                scheduledDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            select: { doctorId: true },
            distinct: ['doctorId'],
        });

        return {
            appointmentsByStatus: appointmentsByStatus.reduce(
                (acc, item) => {
                    acc[item.status] = item._count;
                    return acc;
                },
                {} as Record<string, number>
            ),
            queueLength: queueCount,
            rooms: {
                total: rooms.length,
                occupied: occupiedRooms,
                available: rooms.length - occupiedRooms,
            },
            activeDoctorsCount: activeDoctors.length,
        };
    },

    // Create a Walk-in Appointment
    async createWalkInAppointment(
        clinicId: string,
        data: {
            patientPhone: string;
            patientFirstName: string;
            patientLastName: string;
            doctorId: string;
            serviceId: string;
            price: number;
        }
    ) {
        // 1. Find or Create Patient
        let user = await prisma.user.findFirst({
            where: { phone: data.patientPhone, role: 'PATIENT' }
        });

        let patient;
        if (!user) {
            // Create a "Quick Patient" account
            // Default password is their phone for now
            const passwordHash = await bcrypt.hash(data.patientPhone, config.BCRYPT_ROUNDS);
            user = await prisma.user.create({
                data: {
                    email: `${data.patientPhone}@medico.dz`, // Placeholder email
                    phone: data.patientPhone,
                    passwordHash,
                    role: 'PATIENT',
                    status: 'ACTIVE',
                    phoneVerified: true,
                }
            });

            patient = await prisma.patient.create({
                data: {
                    userId: user.id,
                    firstName: data.patientFirstName,
                    lastName: data.patientLastName,
                    dateOfBirth: new Date('1990-01-01'), // Placeholder
                    gender: 'OTHER',
                }
            });
        } else {
            patient = await prisma.patient.findUnique({
                where: { userId: user.id }
            });
            if (!patient) {
                throw new Error('PATIENT_RECORD_NOT_FOUND');
            }
        }

        // 2. Create Appointment (Directly Checked In)
        const scheduledDate = new Date();
        const scheduledTime = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;

        return prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.create({
                data: {
                    patientId: patient!.id,
                    doctorId: data.doctorId,
                    clinicId,
                    serviceId: data.serviceId,
                    scheduledDate: new Date(new Date().setHours(0, 0, 0, 0)),
                    scheduledTime,
                    duration: 30, // Default for walk-ins
                    status: 'CHECKED_IN',
                    price: data.price,
                    checkInTime: new Date(),
                }
            });

            // 3. Add to Waitlist
            const checkedInCount = await tx.waitlistEntry.count({
                where: {
                    clinicId,
                    checkedInAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                    status: { in: [WaitlistStatus.WAITING, WaitlistStatus.CALLED, WaitlistStatus.WITH_NURSE] },
                },
            });

            const waitlistEntry = await tx.waitlistEntry.create({
                data: {
                    clinicId,
                    appointmentId: appointment.id,
                    queuePosition: checkedInCount + 1,
                    status: WaitlistStatus.WAITING,
                }
            });

            return { appointment, waitlistEntry };
        });
    },

    // Get Patient History (Only if they have an appointment at this clinic)
    async getPatientClinicHistory(clinicId: string, patientId: string) {
        // Privacy Guard: Check for at least one appointment at this clinic
        const appointment = await prisma.appointment.findFirst({
            where: { clinicId, patientId },
        });

        if (!appointment) {
            throw new Error('ACCESS_DENIED_NO_APPOINTMENT_AT_CLINIC');
        }

        // Fetch vitals and medical records
        const [vitals, records] = await Promise.all([
            prisma.vitalRecording.findMany({
                where: { appointment: { patientId } },
                orderBy: { recordedAt: 'desc' },
                take: 5,
            }),
            prisma.medicalRecord.findMany({
                where: { patientId },
                include: { appointment: { select: { scheduledDate: true } } },
                orderBy: { visitDate: 'desc' },
                take: 5,
            })
        ]);

        return { vitals, records };
    }
};

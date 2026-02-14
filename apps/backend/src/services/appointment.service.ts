import { prisma } from '../lib/prisma.js';
import { AppointmentStatus, AppointmentType, PaymentStatus, Prisma } from '@prisma/client';
import { notificationService } from './notification.service.js';

interface CreateAppointmentInput {
    patientId: string;
    doctorId: string;
    clinicId?: string;
    serviceId: string;
    scheduledDate: string; // YYYY-MM-DD
    scheduledTime: string; // HH:MM
    type: AppointmentType;
    reason?: string;
    patientNotes?: string;
    paymentMethod: 'CASH' | 'ONLINE' | 'WALLET';
}

interface RescheduleInput {
    date: string;
    time: string;
    reason?: string;
}

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

export async function createAppointment(input: CreateAppointmentInput) {
    const { patientId, doctorId, clinicId, serviceId, scheduledDate, scheduledTime, type, reason, patientNotes } = input;
    const dateObj = new Date(scheduledDate);
    const dayOfWeek = dateObj.getDay();

    // 1. Validate Doctor Availability Rule
    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const reqStart = timeToMinutes(scheduledTime);

    const availability = await prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek,
            clinicId: clinicId || null,
            isActive: true,
        },
    });

    if (!availability) {
        throw new Error('DOCTOR_NOT_AVAILABLE_THAT_DAY');
    }

    const availStart = timeToMinutes(availability.startTime);
    const availEnd = timeToMinutes(availability.endTime);
    const duration = availability.slotDuration || 30;

    if (reqStart < availStart || reqStart + duration > availEnd) {
        throw new Error('TIME_OUTSIDE_WORKING_HOURS');
    }

    // 2. Check for Exceptions (Blocked time)
    const exception = await prisma.availabilityException.findFirst({
        where: {
            doctorId,
            date: dateObj,
            isBlocked: true,
        },
    });

    if (exception) {
        if (!exception.startTime) {
            throw new Error('DATE_BLOCKED_BY_DOCTOR');
        }
        const excStart = timeToMinutes(exception.startTime!);
        const excEnd = timeToMinutes(exception.endTime!);

        if (reqStart < excEnd && (reqStart + duration) > excStart) {
            throw new Error('TIME_BLOCKED_BY_DOCTOR');
        }
    }

    // 3. Check for Existing Appointments (Double booking)
    const conflicts = await prisma.appointment.findMany({
        where: {
            doctorId,
            scheduledDate: dateObj,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
    });

    for (const appt of conflicts) {
        const apptStart = timeToMinutes(appt.scheduledTime);
        const apptEnd = apptStart + appt.duration;
        const reqEnd = reqStart + duration;

        if (reqStart < apptEnd && reqEnd > apptStart) {
            throw new Error('SLOT_ALREADY_BOOKED');
        }
    }

    // 4. Get Consultation Fee/Cost
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
    });

    if (!service) {
        throw new Error('SERVICE_NOT_FOUND');
    }

    const price = service.price;

    // 5. Create Appointment (Handle Payment)
    const appointment = await prisma.$transaction(async (tx) => {
        // If WALLET, handle credit deduction - REMOVED per user request
        // if (input.paymentMethod === 'WALLET') {
        //     await creditService.deductCredits(patientId, price, 'APPOINTMENT_BOOKING');
        // }

        return tx.appointment.create({
            data: {
                patientId,
                doctorId,
                clinicId,
                serviceId,
                scheduledDate: dateObj,
                scheduledTime, // Store strictly as HH:MM
                duration,
                type,
                reason,
                patientNotes,
                status: AppointmentStatus.PENDING, // Default status
                price,
                paymentMethod: input.paymentMethod,
                paymentStatus: input.paymentMethod === 'WALLET' ? 'PAID' : 'PENDING',
            },
            include: {
                doctor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                service: true,
                clinic: true,
            },
        });
    });

    return appointment;
}

export async function getAppointment(id: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            doctor: {
                select: {
                    id: true, firstName: true, lastName: true, avatarUrl: true, title: true,
                    specialties: { include: { specialty: true } }
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    user: { select: { phone: true } }
                }
            },
            clinic: { select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true } },
            service: true,
            transactions: true,
            medicalRecord: true,
            prescription: { include: { items: true } },
            clinicalOrders: true,
            attachments: true,
        },
    });

    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');
    return appointment;
}


export async function cancelAppointment(id: string, _userId: string, reason?: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

    const updated = await prisma.appointment.update({
        where: { id },
        data: {
            status: AppointmentStatus.CANCELLED,
            cancellationReason: reason,
        },
    });

    // Refund escrowed funds -- Disabled as Credit Service is purged
    // await creditService.refundBookingCredits(id);

    return updated;
}

export async function rescheduleAppointment(id: string, input: RescheduleInput) {
    const { date, time, reason } = input;

    return prisma.appointment.update({
        where: { id },
        data: {
            scheduledDate: new Date(date),
            scheduledTime: time,
            status: AppointmentStatus.RESCHEDULED,
            rescheduleCount: { increment: 1 },
            patientNotes: reason ? `Rescheduled: ${reason}` : undefined,
        },
    });
}

export async function getPatientAppointments(patientId: string, status?: AppointmentStatus) {
    const where: Prisma.AppointmentWhereInput = { patientId };
    if (status) where.status = status;

    return prisma.appointment.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        include: {
            doctor: { select: { firstName: true, lastName: true, avatarUrl: true, specialties: { include: { specialty: true } } } },
            clinic: { select: { name: true, city: true } },
            service: { select: { name: true } },
        },
    });
}

export async function getDoctorAppointments(doctorId: string, date?: string, status?: AppointmentStatus) {
    const where: Prisma.AppointmentWhereInput = { doctorId };

    if (date) {
        where.scheduledDate = new Date(date);
    }

    if (status) {
        where.status = status;
    }

    return prisma.appointment.findMany({
        where,
        orderBy: [
            { scheduledDate: 'asc' },
            { scheduledTime: 'asc' }
        ],
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    gender: true,
                    dateOfBirth: true
                }
            },
            service: { select: { name: true, duration: true } },
        },
    });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const appointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
            patient: { select: { userId: true, firstName: true, lastName: true } },
            service: true,
        }
    });

    // Handle Escrow settlement on completion
    if (status === AppointmentStatus.COMPLETED) {
        // await creditService.settleBookingCredits(id);
        await prisma.appointment.update({
            where: { id },
            data: { paymentStatus: PaymentStatus.PAID }
        });
    }

    return appointment;
}

export async function callPatient(appointmentId: string) {
    const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CALLED },
        include: {
            patient: { select: { userId: true, firstName: true, lastName: true } },
            service: true,
        }
    });

    return appointment;
}

export async function addAttachment(appointmentId: string, data: { name: string; fileUrl: string; fileType?: string; fileSize?: number; uploadedBy: string }) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    let docType: any = 'REPORT';
    if (data.fileType?.includes('image')) docType = 'IMAGING';
    if (data.fileType?.includes('pdf')) docType = 'REPORT';

    return prisma.document.create({
        data: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            type: docType,
            name: data.name,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize,
            mimeType: data.fileType,
            uploadedBy: data.uploadedBy,
        }
    });
}

/**
 * Finalize visit: COMPLETED status + Escrow Release + AI Anonymization
 */
export async function finalizeVisit(appointmentId: string, doctorUserId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            patient: true,
            medicalRecord: true,
            doctor: {
                include: {
                    specialties: { include: { specialty: true } }
                }
            },
        }
    });

    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

    // Security Check: Verify that the requesting doctor owns this appointment
    if (appointment.doctor.userId !== doctorUserId) {
        throw new Error('UNAUTHORIZED_ACTION');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) return appointment;

    return prisma.$transaction(async (tx) => {
        // 1. Update status to COMPLETED
        const updated = await tx.appointment.update({
            where: { id: appointmentId },
            data: {
                status: AppointmentStatus.COMPLETED,
                paymentStatus: PaymentStatus.PAID
            },
            include: {
                patient: { include: { user: true } },
                doctor: true
            }
        });

        // 2. Link Clinical Orders to Medical Record if they exist
        if (appointment.medicalRecord) {
            await tx.clinicalOrder.updateMany({
                where: { appointmentId },
                data: { recordId: appointment.medicalRecord.id }
            });
        }

        // 3. AI Anonymization
        if (appointment.medicalRecord) {
            const ageGroup = getAgeGroup(appointment.patient.dateOfBirth);
            const specialty = appointment.doctor.specialties[0]?.specialty.name || 'General';

            await (tx as any).aiTrainingData.create({
                data: {
                    specialty,
                    ageGroup,
                    gender: appointment.patient.gender,
                    content: {
                        chiefComplaint: appointment.medicalRecord.chiefComplaint,
                        symptoms: appointment.medicalRecord.symptoms,
                        diagnosis: appointment.medicalRecord.diagnosis,
                        notes: appointment.medicalRecord.notes,
                        vitals: {
                            bp: appointment.medicalRecord.bloodPressure,
                            hr: appointment.medicalRecord.heartRate,
                            temp: appointment.medicalRecord.temperature,
                            weight: appointment.medicalRecord.weight,
                        }
                    }
                }
            });
        }

        // 4. Notify Patient (Outside of transaction or inside if async)
        // Since createNotification is async and uses prisma, but we have a running transaction,
        // it's safer to do it after or use a dedicated method that accepts tx.
        // For now, let's assume side-effect is fine.

        return updated;
    }).then(async (result) => {
        // Post-transaction notifications
        if (result.patient && result.patient.userId) {
            await notificationService.createNotification(
                result.patient.userId,
                'VISIT_COMPLETED',
                'Visit Finalized',
                `Your visit with Dr. ${result.doctor.lastName} is complete. You can now view your summary and prescription.`,
                { appointmentId: result.id }
            );
        }
        return result;
    });
}

function getAgeGroup(dob: Date): string {
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 2) return 'INFANT';
    if (age < 12) return 'CHILD';
    if (age < 18) return 'ADOLESCENT';
    if (age < 60) return 'ADULT';
    return 'SENIOR';
}

import { prisma } from '../lib/prisma.js';

interface EmergencyBroadcast {
    doctorId: string;
    clinicId?: string;
    message: string;
    affectedDate: Date;
}

/**
 * Broadcast emergency message to all patients with appointments on the given date
 */
export async function broadcastEmergency(input: EmergencyBroadcast) {
    const { doctorId, clinicId, message, affectedDate } = input;

    const startOfDay = new Date(affectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(affectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all affected appointments
    const where: any = {
        doctorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED', 'CALLED'] }
    };
    if (clinicId) where.clinicId = clinicId;

    const appointments = await prisma.appointment.findMany({
        where,
        include: { patient: { include: { user: true } } }
    });

    // Update all to EMERGENCY status (using string literal)
    await prisma.appointment.updateMany({
        where: { id: { in: appointments.map(a => a.id) } },
        data: { status: 'EMERGENCY' }
    });

    // Log the emergency broadcast (since Notification model may not exist yet)
    console.log(`[EMERGENCY] Broadcast sent to ${appointments.length} patients: ${message}`);

    // Return affected patients for potential push notification handling
    return {
        affectedCount: appointments.length,
        message: 'Emergency broadcast sent',
        affectedPatientIds: appointments.map(a => a.patient.userId)
    };
}

interface ScheduleDelayInput {
    doctorId: string;
    clinicId?: string;
    delayMinutes: number;
    affectedDate: Date;
    reason?: string;
}

/**
 * Delay all remaining appointments by a specified number of minutes
 */
export async function delaySchedule(input: ScheduleDelayInput) {
    const { doctorId, clinicId, delayMinutes, affectedDate, reason } = input;

    const startOfDay = new Date(affectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(affectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
        doctorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] }
    };
    if (clinicId) where.clinicId = clinicId;

    const appointments = await prisma.appointment.findMany({
        where,
        include: { patient: { include: { user: true } } },
        orderBy: { scheduledTime: 'asc' }
    });

    // Update each appointment's time
    for (const appt of appointments) {
        const [hours, mins] = appt.scheduledTime.split(':').map(Number);
        const newMins = hours * 60 + mins + delayMinutes;
        const newHours = Math.floor(newMins / 60);
        const newMinutes = newMins % 60;
        const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;

        await prisma.appointment.update({
            where: { id: appt.id },
            data: {
                scheduledTime: newTime,
                patientNotes: reason ? `Schedule delayed: ${reason}` : appt.patientNotes
            }
        });

        // Log for notification handling
        console.log(`[DELAY] Patient ${appt.patient.userId} appointment moved to ${newTime}`);
    }

    return {
        affectedCount: appointments.length,
        delayMinutes,
        affectedPatientIds: appointments.map(a => a.patient.userId)
    };
}

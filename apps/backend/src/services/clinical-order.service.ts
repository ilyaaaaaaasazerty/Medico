import { prisma } from '../lib/prisma.js';
import { ClinicalOrderType, OrderStatus, LabRequestStatus } from '@prisma/client';

interface CreateOrderInput {
    appointmentId: string;
    recordId?: string;
    type: ClinicalOrderType;
    description: string;
    metadata?: any;
}

/**
 * Create a new clinical order (Lab, Imaging, Procedure, Referral)
 */
export async function createOrder(input: CreateOrderInput) {
    const { appointmentId, recordId, type, description, metadata } = input;

    // Get appointment details to find patient
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { patientId: true, doctorId: true, clinicId: true }
    });

    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

    // Create the Clinical Order first
    const order = await prisma.clinicalOrder.create({
        data: {
            appointmentId,
            recordId,
            type,
            description,
            status: OrderStatus.ORDERED,
            metadata: metadata || {},
        },
    });

    // If it's a Lab or Imaging request and a specific center is selected
    if ((type === 'LAB' || type === 'IMAGING') && metadata?.labCenterId) {
        // Create the Lab Request
        // Note: For Imaging, we also use LabRequest model as per schema (LabType includes RADIOLOGY)
        const labRequest = await prisma.labRequest.create({
            data: {
                labCenterId: metadata.labCenterId,
                patientId: appointment.patientId,
                status: LabRequestStatus.PENDING,
                scheduledDate: new Date(), // Default to today/ASAP
                scheduledTime: 'ASAP', 
                notes: description,
                // We could link specific tests if testIds are passed in metadata
                items: metadata.testIds ? {
                    create: metadata.testIds.map((testId: string) => ({
                        testId
                    }))
                } : undefined
            }
        });

        // Link back: Update ClinicalOrder with the labRequestId
        await prisma.clinicalOrder.update({
            where: { id: order.id },
            data: {
                metadata: {
                    ...(order.metadata as object),
                    labRequestId: labRequest.id
                }
            }
        });

        // We might also want to link the LabRequest to the ClinicalOrder if we added a field,
        // but for now, the link is stored in ClinicalOrder metadata.
    }

    return order;
}

/**
 * Get orders for an appointment
 */
export async function getAppointmentOrders(appointmentId: string) {
    return prisma.clinicalOrder.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get orders created by a doctor (via their appointments)
 */
export async function getDoctorOrders(doctorId: string) {
    return prisma.clinicalOrder.findMany({
        where: {
            appointment: {
                doctorId: doctorId
            }
        },
        include: {
            appointment: {
                select: {
                    patient: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    return prisma.clinicalOrder.update({
        where: { id: orderId },
        data: { status },
    });
}

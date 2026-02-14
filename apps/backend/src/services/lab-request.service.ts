import { prisma } from '../lib/prisma.js';
import { LabRequestStatus } from '@prisma/client';

interface BookLabRequestInput {
    patientId: string;
    labCenterId: string;
    testIds: string[];
    scheduledDate: Date;
    scheduledTime: string;
    prescriptionUrl?: string;
    notes?: string;
}

/**
 * Book a lab request
 */
export async function bookLabRequest(input: BookLabRequestInput) {
    const { patientId, labCenterId, testIds, scheduledDate, scheduledTime, prescriptionUrl, notes } = input;

    // Validate lab center
    const labCenter = await prisma.labCenter.findUnique({
        where: { id: labCenterId },
    });

    if (!labCenter || !labCenter.isActive || labCenter.verificationStatus !== 'APPROVED') {
        throw new Error('LAB_NOT_AVAILABLE');
    }

    // Validate tests exist at this lab
    const tests = await prisma.labTest.findMany({
        where: {
            id: { in: testIds },
            labCenterId,
            isActive: true,
        },
    });

    if (tests.length !== testIds.length) {
        throw new Error('INVALID_TESTS');
    }

    // Calculate total price
    const totalCredits = tests.reduce((sum, test) => sum + test.price, 0);

    // Check patient balance
    const patientRecord = await prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true } });
    const wallet = await prisma.wallet.findUnique({
        where: { userId: patientRecord?.userId || '' }
    });
    if (!wallet || wallet.balance < totalCredits) {
        throw new Error('INSUFFICIENT_CREDITS');
    }

    // Check slot capacity
    const slot = await prisma.labSlot.findFirst({
        where: {
            labCenterId,
            date: scheduledDate,
            startTime: { lte: scheduledTime },
            endTime: { gte: scheduledTime },
            isBlocked: false,
        },
    });

    if (slot && slot.booked >= slot.capacity) {
        throw new Error('SLOT_FULL');
    }

    // Create request
    const labRequest = await prisma.$transaction(async (tx) => {
        const req = await tx.labRequest.create({
            data: {
                patientId,
                labCenterId,
                scheduledDate,
                scheduledTime,
                prescriptionUrl,
                notes,
                status: LabRequestStatus.PENDING,
                items: {
                    create: testIds.map(testId => ({
                        testId,
                    })),
                },
            },
            include: {
                labCenter: { select: { name: true } },
                items: { include: { test: true } },
            },
        });

        // Update slot booked count
        if (slot) {
            await tx.labSlot.update({
                where: { id: slot.id },
                data: { booked: { increment: 1 } },
            });
        }

        return req;
    });

    // Trigger Escrow Hold
    // await creditService.holdLabRequestCredits(labRequest.id);

    return labRequest;
}

/**
 * Get lab request by ID
 */
export async function getLabRequest(requestId: string) {
    const request = await prisma.labRequest.findUnique({
        where: { id: requestId },
        include: {
            patient: {
                select: { id: true, firstName: true, lastName: true },
            },
            labCenter: {
                select: { id: true, name: true, address: true, phone: true },
            },
            items: {
                include: { test: true },
            },
            results: true,
            technician: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });

    if (!request) throw new Error('REQUEST_NOT_FOUND');
    return request;
}

/**
 * Cancel lab request
 */
export async function cancelLabRequest(requestId: string, cancelledBy: 'PATIENT' | 'LAB') {
    const request = await prisma.labRequest.findUnique({
        where: { id: requestId },
        include: { items: { include: { test: true } } },
    });

    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status === LabRequestStatus.CANCELLED || request.status === LabRequestStatus.COMPLETED) {
        throw new Error('CANNOT_CANCEL');
    }

    const totalCredits = request.items.reduce((sum, item) => sum + item.test.price, 0);

    // Calculate refund
    const hoursUntil = (request.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
    let refundPercent = 0;
    if (cancelledBy === 'LAB') {
        refundPercent = 1.0;
    } else {
        if (hoursUntil > 24) refundPercent = 1.0;
        else if (hoursUntil > 12) refundPercent = 0.5;
        else if (hoursUntil > 2) refundPercent = 0.25;
        else refundPercent = 0;
    }

    const refundAmount = Math.floor(totalCredits * refundPercent);

    // Update status
    await prisma.labRequest.update({
        where: { id: requestId },
        data: { status: LabRequestStatus.CANCELLED },
    });

    // Refund if applicable
    if (refundAmount > 0) {
        // await creditService.refundLabRequestCredits(requestId, refundAmount);
    }

    return { requestId, refundAmount };
}

/**
 * Confirm lab request (by lab)
 */
export async function confirmLabRequest(requestId: string) {
    const request = await prisma.labRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status !== LabRequestStatus.PENDING) throw new Error('CANNOT_CONFIRM');

    return prisma.labRequest.update({
        where: { id: requestId },
        data: { status: LabRequestStatus.CONFIRMED },
    });
}

/**
 * Mark sample collected
 */
export async function collectSample(requestId: string, technicianId?: string) {
    const request = await prisma.labRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status !== LabRequestStatus.CONFIRMED) throw new Error('NOT_CONFIRMED');

    return prisma.labRequest.update({
        where: { id: requestId },
        data: {
            status: LabRequestStatus.SAMPLE_COLLECTED,
            technicianId: technicianId || undefined,
        },
    });
}

/**
 * Mark in progress
 */
export async function startProcessing(requestId: string) {
    const request = await prisma.labRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('REQUEST_NOT_FOUND');

    return prisma.labRequest.update({
        where: { id: requestId },
        data: { status: LabRequestStatus.IN_PROGRESS },
    });
}

/**
 * Complete request
 */
export async function completeLabRequest(requestId: string) {
    const updated = await prisma.labRequest.update({
        where: { id: requestId },
        data: {
            status: LabRequestStatus.COMPLETED,
            completedAt: new Date(),
        },
    });

    // Settle payment
    // await creditService.settleLabRequestCredits(requestId);

    return updated;
}

/**
 * Upload result
 */
export async function uploadResult(requestId: string, fileUrl: string, fileName: string, uploadedBy: string, notes?: string) {
    const request = await prisma.labRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('REQUEST_NOT_FOUND');

    return prisma.labResult.create({
        data: {
            requestId,
            fileUrl,
            fileName,
            uploadedBy,
            notes,
        },
    });
}

/**
 * Get results for a request
 */
export async function getResults(requestId: string) {
    return prisma.labResult.findMany({
        where: { requestId },
        orderBy: { uploadedAt: 'desc' },
    });
}

/**
 * Delete result
 */
export async function deleteResult(resultId: string) {
    return prisma.labResult.delete({
        where: { id: resultId },
    });
}

/**
 * Get patient's lab requests
 */
export async function getPatientLabRequests(patientId: string) {
    return prisma.labRequest.findMany({
        where: { patientId },
        include: {
            labCenter: { select: { name: true } },
            items: { include: { test: { select: { name: true, category: true } } } },
            results: { select: { id: true, fileName: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get lab's requests
 */
export async function getLabRequests(labCenterId: string, status?: LabRequestStatus) {
    return prisma.labRequest.findMany({
        where: {
            labCenterId,
            ...(status ? { status } : {}),
        },
        include: {
            patient: { select: { firstName: true, lastName: true } },
            items: { include: { test: { select: { name: true, category: true } } } },
        },
        orderBy: { scheduledDate: 'asc' },
    });
}

/**
 * Get today's queue for lab
 */
export async function getLabTodayQueue(labCenterId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.labRequest.findMany({
        where: {
            labCenterId,
            scheduledDate: {
                gte: today,
                lt: tomorrow,
            },
            status: {
                in: [LabRequestStatus.PENDING, LabRequestStatus.CONFIRMED, LabRequestStatus.SAMPLE_COLLECTED, LabRequestStatus.IN_PROGRESS],
            },
        },
        include: {
            patient: { select: { firstName: true, lastName: true } },
            items: { include: { test: { select: { name: true } } } },
        },
        orderBy: { scheduledTime: 'asc' },
    });
}

/**
 * Get lab analytics
 */
export async function getLabAnalytics(labCenterId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, completed, todayCount] = await Promise.all([
        prisma.labRequest.count({ where: { labCenterId } }),
        prisma.labRequest.count({ where: { labCenterId, status: LabRequestStatus.COMPLETED } }),
        prisma.labRequest.count({
            where: {
                labCenterId,
                scheduledDate: { gte: today },
            },
        }),
    ]);

    return {
        totalRequests: total,
        completedRequests: completed,
        todayRequests: todayCount,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}

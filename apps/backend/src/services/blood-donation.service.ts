import { prisma } from '../lib/prisma.js';
import { BloodType, UrgencyLevel, BloodRequestStatus, DonationResponseStatus } from '@prisma/client';
import { notificationService } from './notification.service.js';

const compatibilityMap: Record<BloodType, BloodType[]> = {
    A_POSITIVE: ['A_POSITIVE', 'A_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    A_NEGATIVE: ['A_NEGATIVE', 'O_NEGATIVE'],
    B_POSITIVE: ['B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    B_NEGATIVE: ['B_NEGATIVE', 'O_NEGATIVE'],
    AB_POSITIVE: ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    AB_NEGATIVE: ['AB_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'O_NEGATIVE'],
    O_POSITIVE: ['O_POSITIVE', 'O_NEGATIVE'],
    O_NEGATIVE: ['O_NEGATIVE'],
};

interface CreateBloodRequestInput {
    patientId: string;
    bloodType: BloodType;
    urgency: UrgencyLevel;
    location: string;
    unitsRequired?: number;
    notes?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Create a new blood request and notify compatible donors
 */
export async function createBloodRequest(input: CreateBloodRequestInput) {
    const request = await prisma.bloodRequest.create({
        data: {
            ...input,
            status: BloodRequestStatus.OPEN,
        },
        include: {
            patient: true,
        },
    });

    // Find compatible donors
    const compatibleTypes = compatibilityMap[input.bloodType];
    const donors = await prisma.patient.findMany({
        where: {
            isDonor: true,
            bloodType: { in: compatibleTypes },
            id: { not: input.patientId },
            lastDonationAt: {
                // Must not have donated in the last 3 months
                lt: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            }
        },
        include: {
            user: true,
        },
    });

    // Notify donors
    const urgencyText = input.urgency === UrgencyLevel.EMERGENCY ? '🔴 EMERGENCY' : '📢 High Urgency';
    const notificationTitle = `${urgencyText}: Blood Donation Needed!`;
    const notificationBody = `A patient needs ${input.bloodType} blood at ${input.location}. Can you help?`;

    for (const donor of donors) {
        await notificationService.createNotification(
            donor.userId,
            'SYSTEM', // We might want a dedicated BLOOD_DONATION type later
            notificationTitle,
            notificationBody,
            { requestId: request.id, type: 'BLOOD_DONATION_REQUEST' }
        );
    }

    return { request, notifiedCount: donors.length };
}

/**
 * Express interest in donating
 */
export async function respondToRequest(requestId: string, donorId: string, notes?: string) {
    return prisma.bloodDonation.create({
        data: {
            requestId,
            donorId,
            notes,
            status: DonationResponseStatus.INTERESTED,
        },
    });
}

/**
 * Update donation status (by requester or donor)
 */
export async function updateDonationStatus(donationId: string, status: DonationResponseStatus) {
    const donation = await prisma.bloodDonation.update({
        where: { id: donationId },
        data: { status },
        include: { donor: true, request: true },
    });

    // If completed, update donor's last donation date
    if (status === DonationResponseStatus.COMPLETED) {
        await prisma.patient.update({
            where: { id: donation.donorId },
            data: { lastDonationAt: new Date() },
        });

        // Check if request is fulfilled
        const completedDonations = await prisma.bloodDonation.count({
            where: { requestId: donation.requestId, status: DonationResponseStatus.COMPLETED },
        });

        if (completedDonations >= (donation.request?.unitsRequired || 0)) {
            await prisma.bloodRequest.update({
                where: { id: donation.requestId! },
                data: { status: BloodRequestStatus.FULFILLED },
            });
        }
    }

    return donation;
}

/**
 * Get active requests for a donor compatible with their type
 */
export async function getRecommendedRequestsForDonor(donorId: string) {
    const donor = await prisma.patient.findUnique({ where: { id: donorId } });
    if (!donor || !donor.bloodType) throw new Error('DONOR_INFO_INCOMPLETE');

    // Find types that this donor can give to
    const recipientTypes = (Object.keys(compatibilityMap) as BloodType[]).filter(
        (recipientType) => compatibilityMap[recipientType].includes(donor.bloodType!)
    );

    return prisma.bloodRequest.findMany({
        where: {
            bloodType: { in: recipientTypes },
            status: BloodRequestStatus.OPEN,
            patientId: { not: donorId },
        },
        include: {
            patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: [
            { urgency: 'asc' }, // Need to handle Enum ordering or custom logic if needed
            { createdAt: 'desc' },
        ],
    });
}

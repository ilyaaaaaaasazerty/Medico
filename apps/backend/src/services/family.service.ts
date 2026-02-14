import { prisma } from '../lib/prisma.js';
import { Gender, BloodType, Relationship } from '@prisma/client';

interface CreateFamilyMemberInput {
    patientId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    relationship: Relationship;
    bloodType?: BloodType;
    allergies?: Record<string, unknown>[];
    conditions?: Record<string, unknown>[];
}

interface UpdateFamilyMemberInput {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    relationship?: Relationship;
    bloodType?: BloodType;
    allergies?: Record<string, unknown>[];
    conditions?: Record<string, unknown>[];
}

/**
 * Get all family members for a patient
 */
export async function getFamilyMembers(patientId: string) {
    return prisma.familyMember.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get single family member
 */
export async function getFamilyMember(patientId: string, memberId: string) {
    const member = await prisma.familyMember.findFirst({
        where: { id: memberId, patientId },
    });

    if (!member) {
        throw new Error('FAMILY_MEMBER_NOT_FOUND');
    }

    return member;
}

/**
 * Add family member
 */
export async function addFamilyMember(input: CreateFamilyMemberInput) {
    return prisma.familyMember.create({
        data: input as any,
    });
}

/**
 * Update family member
 */
export async function updateFamilyMember(
    patientId: string,
    memberId: string,
    input: UpdateFamilyMemberInput
) {
    const member = await prisma.familyMember.findFirst({
        where: { id: memberId, patientId },
    });

    if (!member) {
        throw new Error('FAMILY_MEMBER_NOT_FOUND');
    }

    return prisma.familyMember.update({
        where: { id: memberId },
        data: input as any,
    });
}

/**
 * Remove family member
 */
export async function removeFamilyMember(patientId: string, memberId: string) {
    const member = await prisma.familyMember.findFirst({
        where: { id: memberId, patientId },
    });

    if (!member) {
        throw new Error('FAMILY_MEMBER_NOT_FOUND');
    }

    await prisma.familyMember.delete({ where: { id: memberId } });
    return { success: true };
}

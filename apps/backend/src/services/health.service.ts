import { prisma } from '../lib/prisma.js';
import { Severity } from '@prisma/client';

// ============================================
// ALLERGIES
// ============================================

interface AllergyInput {
    patientId: string;
    name: string;
    severity: Severity;
    reaction?: string;
}

export async function getAllergies(patientId: string) {
    return prisma.allergy.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function addAllergy(input: AllergyInput) {
    return prisma.allergy.create({ data: input });
}

export async function updateAllergy(patientId: string, id: string, input: Partial<AllergyInput>) {
    const allergy = await prisma.allergy.findFirst({ where: { id, patientId } });
    if (!allergy) throw new Error('ALLERGY_NOT_FOUND');
    return prisma.allergy.update({ where: { id }, data: input });
}

export async function removeAllergy(patientId: string, id: string) {
    const allergy = await prisma.allergy.findFirst({ where: { id, patientId } });
    if (!allergy) throw new Error('ALLERGY_NOT_FOUND');
    await prisma.allergy.delete({ where: { id } });
    return { success: true };
}

// ============================================
// CHRONIC CONDITIONS
// ============================================

interface ConditionInput {
    patientId: string;
    name: string;
    diagnosedAt?: Date;
    notes?: string;
}

export async function getConditions(patientId: string) {
    return prisma.chronicCondition.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function addCondition(input: ConditionInput) {
    return prisma.chronicCondition.create({ data: input });
}

export async function updateCondition(patientId: string, id: string, input: Partial<ConditionInput>) {
    const condition = await prisma.chronicCondition.findFirst({ where: { id, patientId } });
    if (!condition) throw new Error('CONDITION_NOT_FOUND');
    return prisma.chronicCondition.update({ where: { id }, data: input });
}

export async function removeCondition(patientId: string, id: string) {
    const condition = await prisma.chronicCondition.findFirst({ where: { id, patientId } });
    if (!condition) throw new Error('CONDITION_NOT_FOUND');
    await prisma.chronicCondition.delete({ where: { id } });
    return { success: true };
}

// ============================================
// MEDICATIONS
// ============================================

interface MedicationInput {
    patientId: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
}

export async function getMedications(patientId: string) {
    return prisma.medication.findMany({
        where: { patientId },
        include: { reminders: true },
        orderBy: { startDate: 'desc' },
    });
}

export async function addMedication(input: MedicationInput) {
    return prisma.medication.create({ data: input });
}

export async function updateMedication(patientId: string, id: string, input: Partial<MedicationInput>) {
    const med = await prisma.medication.findFirst({ where: { id, patientId } });
    if (!med) throw new Error('MEDICATION_NOT_FOUND');
    return prisma.medication.update({ where: { id }, data: input });
}

export async function removeMedication(patientId: string, id: string) {
    const med = await prisma.medication.findFirst({ where: { id, patientId } });
    if (!med) throw new Error('MEDICATION_NOT_FOUND');
    await prisma.medication.delete({ where: { id } });
    return { success: true };
}

// ============================================
// VACCINATIONS
// ============================================

interface VaccinationInput {
    patientId: string;
    name: string;
    dateGiven: Date;
    provider?: string;
    nextDueDate?: Date;
}

export async function getVaccinations(patientId: string) {
    return prisma.vaccination.findMany({
        where: { patientId },
        orderBy: { dateGiven: 'desc' },
    });
}

export async function addVaccination(input: VaccinationInput) {
    return prisma.vaccination.create({ data: input });
}

export async function updateVaccination(patientId: string, id: string, input: Partial<VaccinationInput>) {
    const vax = await prisma.vaccination.findFirst({ where: { id, patientId } });
    if (!vax) throw new Error('VACCINATION_NOT_FOUND');
    return prisma.vaccination.update({ where: { id }, data: input });
}

export async function removeVaccination(patientId: string, id: string) {
    const vax = await prisma.vaccination.findFirst({ where: { id, patientId } });
    if (!vax) throw new Error('VACCINATION_NOT_FOUND');
    await prisma.vaccination.delete({ where: { id } });
    return { success: true };
}

// ============================================
// VITAL SIGNS
// ============================================

interface VitalInput {
    patientId: string;
    type: string;
    value: number;
    unit: string;
    recordedAt: Date;
    notes?: string;
}

export async function getVitals(patientId: string, type?: string, limit = 50) {
    return prisma.vitalSign.findMany({
        where: {
            patientId,
            ...(type && { type }),
        },
        orderBy: { recordedAt: 'desc' },
        take: limit,
    });
}

export async function addVital(input: VitalInput) {
    return prisma.vitalSign.create({ data: input });
}

export async function removeVital(patientId: string, id: string) {
    const vital = await prisma.vitalSign.findFirst({ where: { id, patientId } });
    if (!vital) throw new Error('VITAL_NOT_FOUND');
    await prisma.vitalSign.delete({ where: { id } });
    return { success: true };
}

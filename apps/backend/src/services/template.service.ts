import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

// Template ownership type
type TemplateOwner =
    | { type: 'clinic'; clinicId: string }
    | { type: 'doctor'; doctorId: string }
    | { type: 'lab'; labCenterId: string };

interface TemplateInput {
    logoUrl?: string;
    headerTitle: string;
    headerSubtitle?: string;
    headerAddress?: string;
    headerPhone?: string;
    headerColor?: string;
    footerText?: string;
    signatureUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showRxSymbol?: boolean;
    showDiagnosis?: boolean;
    showPatientId?: boolean;
    showQrCode?: boolean;
    showWatermark?: boolean;
}

/**
 * Get the template owner based on user role and context
 */
export async function getTemplateOwner(userId: string, role: Role): Promise<TemplateOwner | null> {
    switch (role) {
        case 'CLINIC_ADMIN': {
            const clinicAdmin = await prisma.clinicAdmin.findUnique({
                where: { userId },
                select: { clinicId: true },
            });
            return clinicAdmin ? { type: 'clinic', clinicId: clinicAdmin.clinicId } : null;
        }
        case 'DOCTOR': {
            const doctor = await prisma.doctor.findUnique({
                where: { userId },
                select: { id: true, clinicAffiliations: { where: { status: 'ACTIVE' } } },
            });
            if (!doctor) return null;
            // If doctor has active clinic affiliations, they use clinic template (not their own)
            if (doctor.clinicAffiliations.length > 0) {
                return null; // Clinic-affiliated doctors cannot set personal template
            }
            return { type: 'doctor', doctorId: doctor.id };
        }
        case 'LAB_ADMIN': {
            const labAdmin = await prisma.labAdmin.findUnique({
                where: { userId },
                select: { labCenterId: true },
            });
            return labAdmin ? { type: 'lab', labCenterId: labAdmin.labCenterId } : null;
        }
        default:
            return null;
    }
}

/**
 * Get the current template for an owner
 */
export async function getTemplate(owner: TemplateOwner) {
    const whereClause = owner.type === 'clinic'
        ? { clinicId: owner.clinicId }
        : owner.type === 'doctor'
            ? { doctorId: owner.doctorId }
            : { labCenterId: owner.labCenterId };

    return prisma.documentTemplate.findFirst({ where: whereClause });
}

/**
 * Create or update template for an owner
 */
export async function upsertTemplate(owner: TemplateOwner, data: TemplateInput) {
    const whereClause = owner.type === 'clinic'
        ? { clinicId: owner.clinicId }
        : owner.type === 'doctor'
            ? { doctorId: owner.doctorId }
            : { labCenterId: owner.labCenterId };

    const createData = owner.type === 'clinic'
        ? { clinicId: owner.clinicId, ...data }
        : owner.type === 'doctor'
            ? { doctorId: owner.doctorId, ...data }
            : { labCenterId: owner.labCenterId, ...data };

    const existing = await prisma.documentTemplate.findFirst({ where: whereClause });

    if (existing) {
        return prisma.documentTemplate.update({
            where: { id: existing.id },
            data,
        });
    } else {
        return prisma.documentTemplate.create({
            data: createData,
        });
    }
}

/**
 * Update logo URL for template
 */
export async function updateLogo(owner: TemplateOwner, logoUrl: string) {
    const existing = await getTemplate(owner);
    return upsertTemplate(owner, {
        logoUrl,
        headerTitle: existing?.headerTitle || 'Medical Document'
    });
}

/**
 * Update signature URL for template
 */
export async function updateSignature(owner: TemplateOwner, signatureUrl: string) {
    const existing = await getTemplate(owner);
    return upsertTemplate(owner, {
        signatureUrl,
        headerTitle: existing?.headerTitle || 'Medical Document'
    });
}

/**
 * Delete template (reset to defaults)
 */
export async function deleteTemplate(owner: TemplateOwner) {
    const whereClause = owner.type === 'clinic'
        ? { clinicId: owner.clinicId }
        : owner.type === 'doctor'
            ? { doctorId: owner.doctorId }
            : { labCenterId: owner.labCenterId };

    const existing = await prisma.documentTemplate.findFirst({ where: whereClause });
    if (existing) {
        await prisma.documentTemplate.delete({ where: { id: existing.id } });
    }
}

/**
 * Get the applicable template for a prescription/document generation.
 * Priority: Doctor's own template > Clinic template > Default
 */
export async function getApplicableTemplate(doctorId: string) {
    // Check if doctor has their own template (independent doctor)
    const doctorTemplate = await prisma.documentTemplate.findFirst({
        where: { doctorId },
    });
    if (doctorTemplate) return doctorTemplate;

    // Check if doctor is affiliated with a clinic
    const clinicAffiliation = await prisma.clinicDoctor.findFirst({
        where: { doctorId, status: 'ACTIVE' },
        select: { clinicId: true },
    });

    if (clinicAffiliation) {
        const clinicTemplate = await prisma.documentTemplate.findFirst({
            where: { clinicId: clinicAffiliation.clinicId },
        });
        if (clinicTemplate) return clinicTemplate;
    }

    // Return null (use system defaults)
    return null;
}

/**
 * Get the applicable template for a lab result generation.
 */
export async function getLabTemplate(labCenterId: string) {
    return prisma.documentTemplate.findFirst({
        where: { labCenterId },
    });
}

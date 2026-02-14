import { BloodType } from '@prisma/client';

export const compatibilityMap: Record<BloodType, BloodType[]> = {
    A_POSITIVE: ['A_POSITIVE', 'A_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    A_NEGATIVE: ['A_NEGATIVE', 'O_NEGATIVE'],
    B_POSITIVE: ['B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    B_NEGATIVE: ['B_NEGATIVE', 'O_NEGATIVE'],
    AB_POSITIVE: ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    AB_NEGATIVE: ['AB_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'O_NEGATIVE'],
    O_POSITIVE: ['O_POSITIVE', 'O_NEGATIVE'],
    O_NEGATIVE: ['O_NEGATIVE'],
};

/**
 * Checks if a donor blood type is compatible with a recipient blood type.
 */
export function isCompatible(donor: BloodType, recipient: BloodType): boolean {
    return compatibilityMap[recipient]?.includes(donor) || false;
}

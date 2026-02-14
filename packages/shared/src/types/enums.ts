// Enums matching Prisma schema

export enum Role {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
    CLINIC_ADMIN = 'CLINIC_ADMIN',
    LAB_ADMIN = 'LAB_ADMIN',
    SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum UserStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DELETED = 'DELETED',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum BloodType {
    A_POSITIVE = 'A_POSITIVE',
    A_NEGATIVE = 'A_NEGATIVE',
    B_POSITIVE = 'B_POSITIVE',
    B_NEGATIVE = 'B_NEGATIVE',
    O_POSITIVE = 'O_POSITIVE',
    O_NEGATIVE = 'O_NEGATIVE',
    AB_POSITIVE = 'AB_POSITIVE',
    AB_NEGATIVE = 'AB_NEGATIVE',
}

export enum VerificationStatus {
    PENDING = 'PENDING',
    IN_REVIEW = 'IN_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum LabType {
    LABORATORY = 'LABORATORY',
    RADIOLOGY = 'RADIOLOGY',
    BOTH = 'BOTH',
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CHECKED_IN = 'CHECKED_IN',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum AppointmentType {
    IN_PERSON = 'IN_PERSON',
    VIDEO_CALL = 'VIDEO_CALL',
    HOME_VISIT = 'HOME_VISIT',
}

export enum TransactionType {
    PURCHASE = 'PURCHASE',
    APPOINTMENT = 'APPOINTMENT',
    LAB_REQUEST = 'LAB_REQUEST',
    REFUND = 'REFUND',
    BONUS = 'BONUS',
    ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

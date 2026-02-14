// User Types

export interface User {
    id: string;
    email: string;
    phone?: string;
    role: Role;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
}

export interface Patient {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    avatarUrl?: string;
    bloodType?: BloodType;
    phone?: string;
    email?: string;
}

export interface Doctor {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    title?: string;
    avatarUrl?: string;
    bio?: string;
    licenseNumber: string;
    licenseExpiry: string;
    yearsExperience?: number;
    verificationStatus: VerificationStatus;
    consultationFee?: number;
    teleconsultEnabled: boolean;
    averageRating?: number;
    totalReviews: number;
    specialties: Specialty[];
}

export interface Specialty {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
}

export interface Clinic {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    verificationStatus: VerificationStatus;
}

export interface LabCenter {
    id: string;
    name: string;
    type: LabType;
    description?: string;
    logoUrl?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    verificationStatus: VerificationStatus;
    homeCollection: boolean;
}

// Import enums
import { Role, UserStatus, Gender, BloodType, VerificationStatus, LabType } from './enums';

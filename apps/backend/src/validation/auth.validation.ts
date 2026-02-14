import { z } from 'zod';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Phone validation (E.164 format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain uppercase, lowercase, and number'),
    role: z.enum(['PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'LAB_ADMIN', 'TRANSPORT_PROVIDER']),
});


export const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numbers only'),
    type: z.enum(['PHONE', 'EMAIL']),
});

export const resendOtpSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    type: z.enum(['PHONE', 'EMAIL']),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain uppercase, lowercase, and number'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain uppercase, lowercase, and number'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

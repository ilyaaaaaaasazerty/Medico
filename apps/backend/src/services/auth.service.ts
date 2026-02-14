import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { config } from '@/config/env';
import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
} from './token.service';
import {
    storeOtp,
    verifyOtp as verifyOtpCode,
    sendOtpSms,
    sendOtpEmail,
} from './otp.service';
import { Role, UserStatus } from '@prisma/client';

// Types
interface RegisterInput {
    email: string;
    phone: string;
    password: string;
    role: Role;
}

interface LoginInput {
    identifier: string; // email or phone
    password: string;
}

interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        phone: string | null;
        role: Role;
        status: UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        doctor?: {
            firstName: string;
            lastName: string;
        } | null;
    };
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput) {
    const { email, phone, password, role } = input;

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
        throw new Error('EMAIL_EXISTS');
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
        throw new Error('PHONE_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            phone,
            passwordHash,
            role,
            status: 'PENDING',
            emailVerified: false,
            phoneVerified: false,
        },
    });

    // Generate and send OTP
    const otpCode = await storeOtp(user.id, 'PHONE');
    await sendOtpSms(phone, otpCode);

    // Return user without sensitive data
    return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt,
    };
}

/**
 * Verify OTP and activate account
 */
export async function verifyOtp(userId: string, code: string, type: 'PHONE' | 'EMAIL') {
    const result = await verifyOtpCode(userId, code, type);

    if (!result.valid) {
        throw new Error(result.error);
    }

    // Update user verification status
    const updateData: Record<string, boolean | UserStatus> = {};

    if (type === 'PHONE') {
        updateData.phoneVerified = true;
    } else {
        updateData.emailVerified = true;
    }

    // Get current user to check if both are now verified
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    // Check if this makes the user fully verified
    const willBePhoneVerified = type === 'PHONE' ? true : user.phoneVerified;

    // For now, phone verification is enough to activate
    // In the future, can require both: willBePhoneVerified && willBeEmailVerified
    if (willBePhoneVerified) {
        updateData.status = 'ACTIVE';
    }

    await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    return { success: true };
}

/**
 * Resend OTP
 */
export async function resendOtp(userId: string, type: 'PHONE' | 'EMAIL') {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const otpCode = await storeOtp(userId, type);

    if (type === 'PHONE' && user.phone) {
        await sendOtpSms(user.phone, otpCode);
    } else if (type === 'EMAIL') {
        await sendOtpEmail(user.email, otpCode);
    }

    return { success: true };
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResult> {
    const { identifier, password } = input;

    // Find user by email or phone
    const lowerIdentifier = identifier.toLowerCase();
    process.stdout.write(`[AUTH DEBUG] Attempting login for: ${identifier} (normalized: ${lowerIdentifier})\n`);

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { email: lowerIdentifier },
                { phone: identifier }
            ],
        },
        include: {
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    if (!user) {
        process.stdout.write(`[AUTH DEBUG] User not found for identifier: ${identifier}\n`);
        throw new Error('USER_NOT_FOUND');
    }

    process.stdout.write(`[AUTH DEBUG] User found: ${user.id}, Status: ${user.status}, Role: ${user.role}\n`);

    // Check status
    if (user.status === 'SUSPENDED') {
        process.stdout.write(`[AUTH DEBUG] Account suspended for user: ${user.id}\n`);
        throw new Error('ACCOUNT_SUSPENDED');
    }

    if (user.status === 'DELETED') {
        process.stdout.write(`[AUTH DEBUG] Account deleted for user: ${user.id}\n`);
        throw new Error('ACCOUNT_DELETED');
    }

    if (user.status === 'PENDING') {
        process.stdout.write(`[AUTH DEBUG] Account pending verification for user: ${user.id}\n`);
        throw new Error('ACCOUNT_PENDING');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    process.stdout.write(`[AUTH DEBUG] Password verification result: ${validPassword}\n`);
    if (!validPassword) {
        throw new Error('INVALID_PASSWORD');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    // Store session
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt,
            userAgent: 'Mobile App', // TODO: Get from request
            ipAddress: '0.0.0.0', // TODO: Get from request
        },
    });

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            doctor: user.doctor,
        },
    };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
    const session = await prisma.session.findFirst({
        where: { refreshToken },
        include: { user: true },
    });

    if (!session) {
        throw new Error('SESSION_NOT_FOUND');
    }

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new Error('SESSION_EXPIRED');
    }

    if (session.user.status !== 'ACTIVE') {
        throw new Error('ACCOUNT_SUSPENDED');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
    });

    // Update session activity
    await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
    });

    return { accessToken };
}

/**
 * Forgot password - send reset token
 */
export async function forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Don't reveal if email exists
        return { success: true };
    }

    // Generate reset token (use OTP for simplicity)
    const otpCode = await storeOtp(user.id, 'EMAIL');
    await sendOtpEmail(email, otpCode);

    return { success: true };
}

/**
 * Reset password with OTP
 */
export async function resetPassword(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    // Verify OTP
    const result = await verifyOtpCode(user.id, code, 'EMAIL');
    if (!result.valid) {
        throw new Error(result.error);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
        where: { userId: user.id },
    });

    return { success: true };
}

/**
 * Logout - invalidate session
 */
export async function logout(refreshToken: string) {
    await prisma.session.deleteMany({
        where: { refreshToken },
    });

    return { success: true };
}

/**
 * Logout all sessions
 */
export async function logoutAll(userId: string) {
    await prisma.session.deleteMany({
        where: { userId },
    });

    return { success: true };
}

/**
 * Get user sessions
 */
export async function getSessions(userId: string) {
    const sessions = await prisma.session.findMany({
        where: { userId },
        select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            lastActiveAt: true,
        },
        orderBy: { lastActiveAt: 'desc' },
    });

    return sessions;
}

/**
 * Delete specific session
 */
export async function deleteSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) {
        throw new Error('SESSION_NOT_FOUND');
    }

    await prisma.session.delete({ where: { id: sessionId } });

    return { success: true };
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true,
            lastLoginAt: true,
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    return user;
}
/**
 * Request password change OTP (logged in)
 */
export async function requestPasswordChangeOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.phone) {
        throw new Error('USER_NOT_FOUND');
    }

    const otpCode = await storeOtp(userId, 'PHONE');
    await sendOtpSms(user.phone, otpCode);

    return { success: true };
}

/**
 * Change password with OTP (logged in)
 */
export async function changePasswordWithOtp(userId: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    // Verify OTP
    const result = await verifyOtpCode(userId, code, 'PHONE');
    if (!result.valid) {
        throw new Error(result.error);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
        where: { userId },
    });

    return { success: true };
}

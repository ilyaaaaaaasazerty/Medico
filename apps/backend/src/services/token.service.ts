import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '@/config/env';

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Generate JWT access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN as any,
    });
}

/**
 * Generate refresh token (long-lived random string)
 */
export function generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
    const days = parseInt(config.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}


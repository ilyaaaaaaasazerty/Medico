import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
    register,
    verifyOtp,
    resendOtp,
    login,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    logout,
    logoutAll,
    getSessions,
    deleteSession,
    getCurrentUser,
    requestPasswordChangeOtp,
    changePasswordWithOtp,
} from '@/services/auth.service';
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    changePasswordSchema,
} from '@/validation/auth.validation';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Error handler helper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Validation middleware
const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
            return;
        }
        next(error);
    }
};

/**
 * POST /auth/register
 * Create a new user account
 */
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        try {
            const user = await register(req.body);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please verify your phone.',
                data: user,
            });
        } catch (error: any) {
            const errorMap: Record<string, { status: number; message: string }> = {
                EMAIL_EXISTS: { status: 409, message: 'Email already registered' },
                PHONE_EXISTS: { status: 409, message: 'Phone already registered' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);

/**
 * POST /auth/register-transport
 * Create a transport provider account (taxi/ambulance)
 */
router.post(
    '/register-transport',
    asyncHandler(async (req, res) => {
        const { email, phone, password, companyName, licenseNumber, type } = req.body;

        if (!email || !phone || !password || !companyName || !licenseNumber) {
            res.status(400).json({ success: false, error: 'All fields are required' });
            return;
        }

        try {
            // Register the user with TRANSPORT_PROVIDER role
            const user = await register({
                email,
                phone,
                password,
                role: 'TRANSPORT_PROVIDER',
            });

            // Import prisma here to create the TransportProvider profile
            const { prisma } = await import('@/lib/prisma');

            // Create the TransportProvider profile with a default vehicle
            await prisma.transportProvider.create({
                data: {
                    userId: user.id,
                    companyName,
                    licenseNumber,
                    type: type || 'AMBULANCE',
                    status: 'OFFLINE',
                    verificationStatus: 'PENDING',
                    isIndividual: true,
                    vehicles: {
                        create: {
                            type: type === 'NON_EMERGENCY' ? 'NON_EMERGENCY' : 'AMBULANCE',
                            licensePlate: licenseNumber, // Default to same as provider license for individual
                            isAvailable: true,
                        }
                    }
                },
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please verify your phone.',
                data: user,
            });
        } catch (error: any) {
            const errorMap: Record<string, { status: number; message: string }> = {
                EMAIL_EXISTS: { status: 409, message: 'Email already registered' },
                PHONE_EXISTS: { status: 409, message: 'Phone already registered' },
                LICENSE_EXISTS: { status: 409, message: 'License number already registered' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);


/**
 * POST /auth/verify-otp
 * Verify phone or email with OTP
 */
router.post(
    '/verify-otp',
    validate(verifyOtpSchema),
    asyncHandler(async (req, res) => {
        try {
            await verifyOtp(req.body.userId, req.body.code, req.body.type);
            res.json({
                success: true,
                message: 'Verification successful',
            });
        } catch (error: any) {
            const errorMap: Record<string, { status: number; message: string }> = {
                OTP_NOT_FOUND: { status: 400, message: 'No OTP found. Please request a new one.' },
                OTP_EXPIRED: { status: 400, message: 'OTP has expired. Please request a new one.' },
                OTP_INVALID: { status: 400, message: 'Invalid OTP code' },
                USER_NOT_FOUND: { status: 404, message: 'User not found' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);

/**
 * POST /auth/resend-otp
 * Resend OTP code
 */
router.post(
    '/resend-otp',
    validate(resendOtpSchema),
    asyncHandler(async (req, res) => {
        try {
            await resendOtp(req.body.userId, req.body.type);
            res.json({
                success: true,
                message: 'OTP sent successfully',
            });
        } catch (error: any) {
            if (error.message === 'USER_NOT_FOUND') {
                res.status(404).json({ success: false, error: 'User not found' });
            } else {
                throw error;
            }
        }
    })
);

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        try {
            const result = await login(req.body);
            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            const logMsg = `[Login Failed]: ${error.message}`;
            console.error(logMsg);
            process.stdout.write(`${logMsg}\n`);
            const errorMap: Record<string, { status: number; message: string }> = {
                USER_NOT_FOUND: { status: 401, message: 'Invalid credentials' },
                INVALID_PASSWORD: { status: 401, message: 'Invalid credentials' },
                ACCOUNT_SUSPENDED: { status: 403, message: 'Account suspended' },
                ACCOUNT_DELETED: { status: 403, message: 'Account has been deleted' },
                ACCOUNT_PENDING: { status: 403, message: 'Please verify your account first' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
    '/refresh',
    validate(refreshTokenSchema),
    asyncHandler(async (req, res) => {
        try {
            const result = await refreshAccessToken(req.body.refreshToken);
            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            const errorMap: Record<string, { status: number; message: string }> = {
                SESSION_NOT_FOUND: { status: 401, message: 'Invalid refresh token' },
                SESSION_EXPIRED: { status: 401, message: 'Session expired. Please login again.' },
                ACCOUNT_SUSPENDED: { status: 403, message: 'Account suspended' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    asyncHandler(async (req, res) => {
        await forgotPassword(req.body.email);
        // Always return success to not reveal if email exists
        res.json({
            success: true,
            message: 'If the email exists, a reset code has been sent.',
        });
    })
);

/**
 * POST /auth/reset-password
 * Reset password with OTP code
 */
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    asyncHandler(async (req, res) => {
        try {
            await resetPassword(req.body.email, req.body.code, req.body.password);
            res.json({
                success: true,
                message: 'Password reset successful. Please login with your new password.',
            });
        } catch (error: any) {
            const errorMap: Record<string, { status: number; message: string }> = {
                USER_NOT_FOUND: { status: 404, message: 'User not found' },
                OTP_NOT_FOUND: { status: 400, message: 'Invalid or expired reset code' },
                OTP_EXPIRED: { status: 400, message: 'Reset code has expired' },
                OTP_INVALID: { status: 400, message: 'Invalid reset code' },
            };
            const mapped = errorMap[error.message];
            if (mapped) {
                res.status(mapped.status).json({ success: false, error: mapped.message });
            } else {
                throw error;
            }
        }
    })
);

/**
 * DELETE /auth/logout
 * End current session
 */
router.delete(
    '/logout',
    asyncHandler(async (req, res) => {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
        if (refreshToken) {
            await logout(refreshToken as string);
        }
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    })
);

/**
 * DELETE /auth/sessions
 * End all sessions (requires auth)
 */
router.delete(
    '/sessions',
    authenticate,
    asyncHandler(async (req: any, res) => {
        await logoutAll(req.user!.userId);
        res.json({
            success: true,
            message: 'All sessions ended',
        });
    })
);

/**
 * GET /auth/sessions
 * List all active sessions (requires auth)
 */
router.get(
    '/sessions',
    authenticate,
    asyncHandler(async (req: any, res) => {
        const sessions = await getSessions(req.user!.userId);
        res.json({
            success: true,
            data: sessions,
        });
    })
);

/**
 * DELETE /auth/sessions/:id
 * End specific session (requires auth)
 */
router.delete(
    '/sessions/:id',
    authenticate,
    asyncHandler(async (req: any, res) => {
        try {
            await deleteSession(req.user!.userId, req.params.id);
            res.json({
                success: true,
                message: 'Session ended',
            });
        } catch (error: any) {
            if (error.message === 'SESSION_NOT_FOUND') {
                res.status(404).json({ success: false, error: 'Session not found' });
            } else {
                throw error;
            }
        }
    })
);

/**
 * GET /auth/me
 * Get current user profile (requires auth)
 */
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: any, res) => {
        const user = await getCurrentUser(req.user!.id);
        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * POST /auth/change-password/request-otp
 * Request password change OTP (requires auth)
 */
router.post(
    '/change-password/request-otp',
    authenticate,
    asyncHandler(async (req: any, res) => {
        await requestPasswordChangeOtp(req.user!.id);
        res.json({
            success: true,
            message: 'OTP sent to your phone number',
        });
    })
);

/**
 * POST /auth/change-password/verify
 * Change password with OTP code (requires auth)
 */
router.post(
    '/change-password/verify',
    authenticate,
    validate(changePasswordSchema),
    asyncHandler(async (req: any, res) => {
        try {
            await changePasswordWithOtp(req.user!.id, req.body.code, req.body.password);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error: any) {
            if (error.message === 'OTP_INVALID') {
                res.status(400).json({ success: false, error: 'Invalid OTP code' });
            } else if (error.message === 'OTP_EXPIRED') {
                res.status(400).json({ success: false, error: 'OTP has expired' });
            } else {
                throw error;
            }
        }
    })
);

export default router;


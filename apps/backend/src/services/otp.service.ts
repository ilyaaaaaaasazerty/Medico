import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a 6-digit OTP
 */
export function generateOtpCode(): string {
    return randomInt(100000, 999999).toString();
}

/**
 * Store OTP in database
 */
export async function storeOtp(userId: string, type: 'PHONE' | 'EMAIL'): Promise<string> {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing OTP for this user and type
    await prisma.oTP.deleteMany({
        where: { userId, type },
    });

    // Create new OTP
    await prisma.oTP.create({
        data: {
            userId,
            code,
            type,
            expiresAt,
        },
    });

    return code;
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
    userId: string,
    code: string,
    type: 'PHONE' | 'EMAIL'
): Promise<{ valid: boolean; error?: string }> {
    const otp = await prisma.oTP.findFirst({
        where: { userId, type },
    });

    if (!otp) {
        return { valid: false, error: 'OTP_NOT_FOUND' };
    }

    if (otp.expiresAt < new Date()) {
        await prisma.oTP.delete({ where: { id: otp.id } });
        return { valid: false, error: 'OTP_EXPIRED' };
    }

    if (otp.code !== code) {
        return { valid: false, error: 'OTP_INVALID' };
    }

    // Delete used OTP
    await prisma.oTP.delete({ where: { id: otp.id } });

    return { valid: true };
}

/**
 * Send OTP via SMS (placeholder - integrate with actual SMS provider)
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
    // In development, just log the OTP
    console.log(`📱 [DEV] OTP for ${phone}: ${code}`);

    // TODO: Integrate with Twilio, Vonage, or local SMS provider
    // Example:
    // await twilioClient.messages.create({
    //   body: `Your Medico verification code is: ${code}`,
    //   to: phone,
    //   from: env.TWILIO_PHONE_NUMBER,
    // });
}

/**
 * Send OTP via Email (placeholder - integrate with email provider)
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
    // In development, just log the OTP
    console.log(`📧 [DEV] OTP for ${email}: ${code}`);

    // TODO: Integrate with SendGrid, AWS SES, or other email provider
    // Example:
    // await sendgrid.send({
    //   to: email,
    //   subject: 'Medico Verification Code',
    //   text: `Your verification code is: ${code}`,
    // });
}

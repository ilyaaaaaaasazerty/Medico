import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';

const OTP_EXPIRY_MINUTES = 10;

export function generateOtpCode(): string {
    return randomInt(100000, 999999).toString();
}

export async function storeOtp(userId: string, type: 'PHONE' | 'EMAIL'): Promise<string> {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.oTP.deleteMany({ where: { userId, type } });
    await prisma.oTP.create({ data: { userId, code, type, expiresAt } });

    return code;
}

export async function verifyOtp(
    userId: string,
    code: string,
    type: 'PHONE' | 'EMAIL'
): Promise<{ valid: boolean; error?: string }> {
    const otp = await prisma.oTP.findFirst({ where: { userId, type } });

    if (!otp) return { valid: false, error: 'OTP_NOT_FOUND' };
    if (otp.expiresAt < new Date()) {
        await prisma.oTP.delete({ where: { id: otp.id } });
        return { valid: false, error: 'OTP_EXPIRED' };
    }
    if (otp.code !== code) return { valid: false, error: 'OTP_INVALID' };

    await prisma.oTP.delete({ where: { id: otp.id } });
    return { valid: true };
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
    await smsService.sendSms(phone, `Your Medico verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`);
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
    const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#0A84FF;margin-bottom:8px">Medico Verification</h2>
            <p style="color:#444;margin-bottom:24px">Use the code below to verify your account. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
            <div style="background:#f4f6f8;border-radius:12px;padding:24px;text-align:center">
                <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#0A84FF">${code}</span>
            </div>
            <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this code, you can safely ignore this email.</p>
        </div>
    `;
    await emailService.sendHtml(email, 'Your Medico Verification Code', html);
}

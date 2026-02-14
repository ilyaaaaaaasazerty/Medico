import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Server
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Bcrypt
    BCRYPT_ROUNDS: z.string().default('12'),

    // OTP
    OTP_EXPIRES_MINUTES: z.string().default('10'),

    // File Upload
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE: z.string().default('10485760'),

    // Frontend URLs
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    MOBILE_URL: z.string().default('exp://localhost:8081'),
    BACKEND_URL: z.string().default('http://192.168.1.5:3001'),

    // Email (optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    // SMS (optional)
    SMS_PROVIDER: z.string().optional(),
    SMS_API_KEY: z.string().optional(),
    SMS_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const config = {
    ...parsed.data,
    PORT: parseInt(parsed.data.PORT, 10),
    BCRYPT_ROUNDS: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
    OTP_EXPIRES_MINUTES: parseInt(parsed.data.OTP_EXPIRES_MINUTES, 10),
    MAX_FILE_SIZE: parseInt(parsed.data.MAX_FILE_SIZE, 10),
};

export type Config = typeof config;

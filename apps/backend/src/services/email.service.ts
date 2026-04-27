import nodemailer from 'nodemailer';
import { createBreaker } from '../lib/circuitBreaker.js';
import { config } from '../config/env.js';

function createTransport() {
    if (!config.SMTP_HOST || !config.SMTP_USER) return null;
    return nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: (config.SMTP_PORT || 587) === 465,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
}

const transport = createTransport();

const _sendEmail = async (to: string, subject: string, body: string) => {
    if (!transport) {
        console.warn(`[EmailService] SMTP not configured — skipping email to ${to}: "${subject}"`);
        return true;
    }
    await transport.sendMail({
        from: config.EMAIL_FROM || config.SMTP_USER,
        to,
        subject,
        html: body,
    });
    return true;
};

const emailBreaker = createBreaker(_sendEmail, 'EmailService');

export const emailService = {
    sendEmail: (to: string, subject: string, body: string) =>
        emailBreaker.fire(to, subject, body),

    sendHtml: (to: string, subject: string, html: string) =>
        emailBreaker.fire(to, subject, html),
};

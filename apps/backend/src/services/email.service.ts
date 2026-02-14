import { createBreaker } from '../lib/circuitBreaker.js';

const _sendEmail = async (to: string, subject: string, body: string) => {
    console.log(`[EmailService] Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    // Mock implementation - simply return true
    return true;
};

const emailBreaker = createBreaker(_sendEmail, 'EmailService');

export const emailService = {
    sendEmail: (to: string, subject: string, body: string) => emailBreaker.fire(to, subject, body)
};

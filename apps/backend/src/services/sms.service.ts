import { createBreaker } from '../lib/circuitBreaker.js';

const _sendSms = async (to: string, body: string) => {
    console.log(`[SmsService] Sending SMS to ${to}`);
    console.log(`Message: ${body}`);
    // Mock implementation - simply return true
    return { success: true };
};

const smsBreaker = createBreaker(_sendSms, 'SmsService');

export const smsService = {
    sendSms: (to: string, body: string) => smsBreaker.fire(to, body)
};

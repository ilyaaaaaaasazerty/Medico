import { createBreaker } from '../lib/circuitBreaker.js';
import { config } from '../config/env.js';

let twilioClient: any = null;

function getTwilioClient() {
    if (twilioClient) return twilioClient;
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) return null;
    const twilio = require('twilio');
    twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    return twilioClient;
}

const _sendSms = async (to: string, body: string) => {
    const client = getTwilioClient();
    if (!client) {
        console.warn(`[SmsService] Twilio not configured — skipping SMS to ${to}: "${body}"`);
        return { success: true };
    }
    await client.messages.create({
        body,
        from: config.TWILIO_PHONE_NUMBER,
        to,
    });
    return { success: true };
};

const smsBreaker = createBreaker(_sendSms, 'SmsService');

export const smsService = {
    sendSms: (to: string, body: string) => smsBreaker.fire(to, body),
};

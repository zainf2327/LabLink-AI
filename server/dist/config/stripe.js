import { env } from './env.js';
// Stub Stripe configuration
export const stripeConfig = {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
};
console.log('Stripe Config initialized (Test mode)');

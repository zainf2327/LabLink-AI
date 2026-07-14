import { env } from './env.js';

// Stub Stripe configuration
export const stripeConfig = {
  secretKey: env.STRIPE_SECRET_KEY || '',
};

console.log('Stripe Config initialized (Stub)');

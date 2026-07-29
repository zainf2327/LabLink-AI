import { env } from './env.js';
import logger from '../utils/logger.js';
// Stub Stripe configuration
export const stripeConfig = {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
};
logger.info('Stripe Config initialized (Test mode)');

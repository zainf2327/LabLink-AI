import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe.js';
if (!stripeConfig.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
}
const stripe = new Stripe(stripeConfig.secretKey);
export const stripeService = {
    async createPaymentIntent(amountInCents, currency, bookingId) {
        try {
            const intent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: currency.toLowerCase(),
                metadata: { bookingId },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return {
                id: intent.id,
                client_secret: intent.client_secret,
            };
        }
        catch (error) {
            console.error('Error creating Stripe PaymentIntent:', error);
            throw error;
        }
    },
    async retrievePaymentIntent(paymentIntentId) {
        try {
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return {
                status: intent.status,
                client_secret: intent.client_secret,
            };
        }
        catch (error) {
            console.error('Error retrieving Stripe PaymentIntent:', error);
            throw error;
        }
    },
};

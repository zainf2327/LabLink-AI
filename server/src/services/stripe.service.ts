import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe.js';

let stripe: Stripe | null = null;
if (stripeConfig.secretKey) {
  stripe = new Stripe(stripeConfig.secretKey);
} else {
  console.warn('⚠️ Stripe secret key is missing. Stripe service will run in MOCK mode.');
}

export const stripeService = {
  async createPaymentIntent(
    amountInCents: number,
    currency: string,
    bookingId: string
  ): Promise<{ id: string; client_secret: string | null }> {
    if (!stripe) {
      // Mock mode fallback
      const mockId = `pi_mock_${Math.random().toString(36).substring(2, 11)}`;
      return {
        id: mockId,
        client_secret: `${mockId}_secret_mock`,
      };
    }

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
    } catch (error) {
      console.error('Error creating Stripe PaymentIntent:', error);
      throw error;
    }
  },

  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<{ status: string; client_secret: string | null }> {
    if (!stripe || paymentIntentId.startsWith('pi_mock_')) {
      // Mock mode fallback
      return { status: 'succeeded', client_secret: `${paymentIntentId}_secret_mock` };
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        status: intent.status,
        client_secret: intent.client_secret,
      };
    } catch (error) {
      console.error('Error retrieving Stripe PaymentIntent:', error);
      throw error;
    }
  },
};

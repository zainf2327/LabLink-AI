import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe.js';
import { paymentService } from '../services/payment.service.js';
import Payment from '../models/Payment.model.js';
import logger from '../utils/logger.js';
export const stripeWebhookHandler = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = stripeConfig.webhookSecret;
    let event;
    if (!stripeConfig.secretKey) {
        logger.warn('Stripe secret key is missing, ignoring webhook.');
        res.status(200).send();
        return;
    }
    const stripe = new Stripe(stripeConfig.secretKey);
    try {
        if (!endpointSecret) {
            // In dev mode without a webhook secret, we might just parse the body directly,
            // but Stripe recommends always using the constructEvent with a secret.
            logger.warn('No Stripe Webhook Secret configured. Failing securely.');
            res.status(400).send('Webhook Secret not configured.');
            return;
        }
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                logger.info(`PaymentIntent was successful: ${paymentIntent.id}`);
                await paymentService.processSuccessfulPayment(paymentIntent.id);
                break;
            }
            case 'payment_intent.payment_failed': {
                const failedIntent = event.data.object;
                logger.warn(`PaymentIntent failed: ${failedIntent.id}`);
                const payment = await Payment.findOne({ stripePaymentIntentId: failedIntent.id });
                if (payment && payment.status !== 'succeeded') {
                    payment.status = 'failed';
                    await payment.save();
                }
                break;
            }
            default:
                // Unexpected event type
                logger.info(`Unhandled event type ${event.type}`);
        }
    }
    catch (err) {
        logger.error(`Error processing webhook event ${event.type}: ${err.message}`);
        // Return 500 so Stripe retries
        res.status(500).send('Webhook handler failed.');
        return;
    }
    res.json({ received: true });
};

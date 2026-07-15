import { Router } from 'express';
import express from 'express';
import { stripeWebhookHandler } from '../controllers/webhook.controller.js';

const router = Router();

// Stripe requires the raw body to construct the event
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

export default router;

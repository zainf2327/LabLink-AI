import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';
import WalletTransaction from '../models/WalletTransaction.model.js';
import Payment from '../models/Payment.model.js';
import { stripeService } from '../services/stripe.service.js';
import { paymentService } from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * GET /api/v1/wallet/balance
 * Returns the authenticated patient's current wallet balance.
 * Access: Patient
 */
export const getWalletBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const user = await User.findById(req.user.id).select('walletBalance');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      walletBalance: user.walletBalance,
    },
  });
});

/**
 * GET /api/v1/wallet/transactions
 * Returns paginated wallet transaction history for the authenticated patient.
 * Access: Patient
 * Query Params: page (default 1), limit (default 10)
 */
export const getWalletTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const total = await WalletTransaction.countDocuments({ userId: req.user.id });
  const transactions = await WalletTransaction.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('bookingId', 'status finalAmount tests createdAt');

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

/**
 * POST /api/v1/wallet/topup/intent
 * Creates a Stripe PaymentIntent for the requested top-up amount.
 * Access: Patient
 * Body: { amount: number } — amount in USD dollars
 */
export const createTopUpIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { amount } = req.body as { amount: number };

  const amountInCents = Math.round(amount * 100);
  const intent = await stripeService.createPaymentIntent(
    amountInCents,
    'usd',
    `wallet_topup_${req.user.id}`,
    `wallet_topup_${req.user.id}_${Date.now()}`
  );

  // Create a pending Payment record in DB for webhook traceability
  await Payment.create({
    paymentFor: 'wallet_topup',
    patientId: req.user.id,
    amount: amount,
    walletAmountUsed: 0,
    currency: 'usd',
    method: 'stripe',
    stripePaymentIntentId: intent.id,
    status: 'pending',
  });

  res.status(200).json({
    success: true,
    data: {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    },
  });
});

/**
 * POST /api/v1/wallet/topup/confirm
 * Verifies the Stripe PaymentIntent succeeded, credits the patient's wallet,
 * writes a WalletTransaction record, and fires an in-app notification.
 * Access: Patient
 * Body: { paymentIntentId: string }
 */
export const confirmTopUp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { paymentIntentId } = req.body as { paymentIntentId: string };

  logger.info(`[Confirm Endpoint] confirmTopUp request received for Intent: ${paymentIntentId}`);

  // Delegate processing to the idempotent service helper
  const { walletBalance, creditAmount } = await paymentService.processSuccessfulTopUp(paymentIntentId);

  res.status(200).json({
    success: true,
    message: `Wallet topped up successfully`,
    data: {
      walletBalance,
      creditAmount,
    },
  });
});


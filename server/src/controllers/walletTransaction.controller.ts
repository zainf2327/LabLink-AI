import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';
import WalletTransaction from '../models/WalletTransaction.model.js';

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

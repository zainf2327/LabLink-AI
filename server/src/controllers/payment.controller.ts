import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/Payment.model.js';
import { bookingService } from '../services/booking.service.js';

export const createPaymentIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId } = req.body;
  if (!bookingId) {
    res.status(400).json({ success: false, message: 'bookingId is required' });
    return;
  }

  const result = await bookingService.createPaymentIntent(req.user.id, bookingId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    res.status(400).json({ success: false, message: 'paymentIntentId is required' });
    return;
  }

  const booking = await bookingService.confirmPayment(req.user.id, paymentIntentId);

  res.status(200).json({
    success: true,
    message: 'Payment confirmed and booking scheduled',
    data: { booking },
  });
});

export const getMyBillingHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const total = await Payment.countDocuments({ patientId: req.user.id });
  const payments = await Payment.find({ patientId: req.user.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('bookingId');

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

export const getAllPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const total = await Payment.countDocuments();
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('patientId', 'name email')
    .populate('bookingId');

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

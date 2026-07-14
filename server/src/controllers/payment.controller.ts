import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const createPaymentIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: payments/createPaymentIntent' });
});

export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: payments/confirmPayment' });
});

export const getMyBillingHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: payments/getMyBillingHistory' });
});

export const getAllPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: payments/getAllPayments' });
});

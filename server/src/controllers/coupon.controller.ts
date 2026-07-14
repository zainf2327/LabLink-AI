import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const createCoupon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/createCoupon' });
});

export const getAllCoupons = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/getAllCoupons' });
});

export const getCouponById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/getCouponById' });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/updateCoupon' });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/deleteCoupon' });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: coupons/validateCoupon' });
});

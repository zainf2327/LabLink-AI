import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Coupon from '../models/Coupon.model.js';

export const createCoupon = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      res.status(400).json({
        success: false,
        message: 'Code, discountType, and discountValue are required',
      });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue !== undefined ? minOrderValue : null,
      maxUses: maxUses !== undefined ? maxUses : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      data: { coupon },
    });
  }
);

export const getAllCoupons = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { coupons },
    });
  }
);

export const getCouponById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { coupon },
    });
  }
);

export const updateCoupon = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;

    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxUses !== undefined) coupon.maxUses = maxUses;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      data: { coupon },
    });
  }
);

export const deleteCoupon = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  }
);

export const validateCoupon = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { code, totalAmount } = req.body;

    if (!code || totalAmount === undefined) {
      res.status(400).json({
        success: false,
        message: 'Coupon code and totalAmount are required',
      });
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ success: false, message: 'Coupon has expired' });
      return;
    }

    if (
      coupon.maxUses !== undefined &&
      coupon.maxUses !== null &&
      coupon.usedCount >= coupon.maxUses
    ) {
      res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      return;
    }

    if (
      coupon.minOrderValue !== undefined &&
      coupon.minOrderValue !== null &&
      totalAmount < coupon.minOrderValue
    ) {
      res.status(400).json({
        success: false,
        message: `Minimum order value for coupon is $${coupon.minOrderValue}`,
      });
      return;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (coupon.discountValue / 100) * totalAmount;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, totalAmount);

    res.status(200).json({
      success: true,
      data: {
        couponId: coupon._id,
        discountAmount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  }
);

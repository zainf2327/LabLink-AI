import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Coupon from '../models/Coupon.model.js';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from '../utils/validators.js';


export const createCoupon = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validated = req.body;

    const coupon = new Coupon({
      code: validated.code.toUpperCase(),
      discountType: validated.discountType,
      discountValue: validated.discountValue,
      minOrderValue: validated.minOrderValue !== undefined ? validated.minOrderValue : null,
      maxUses: validated.maxUses !== undefined ? validated.maxUses : null,
      expiresAt: validated.expiresAt ? validated.expiresAt : null,
      isActive: validated.isActive !== undefined ? validated.isActive : true,
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

    const validated = req.body;

    if (validated.code) coupon.code = validated.code.toUpperCase();
    if (validated.discountType) coupon.discountType = validated.discountType;
    if (validated.discountValue !== undefined) coupon.discountValue = validated.discountValue;
    if (validated.minOrderValue !== undefined) coupon.minOrderValue = validated.minOrderValue;
    if (validated.maxUses !== undefined) coupon.maxUses = validated.maxUses;
    if (validated.expiresAt !== undefined) coupon.expiresAt = validated.expiresAt;
    if (validated.isActive !== undefined) coupon.isActive = validated.isActive;

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
    const validated = req.body;

    const coupon = await Coupon.findOne({
      code: validated.code.toUpperCase(),
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
      validated.totalAmount < coupon.minOrderValue
    ) {
      res.status(400).json({
        success: false,
        message: `Minimum order value for coupon is $${coupon.minOrderValue}`,
      });
      return;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (coupon.discountValue / 100) * validated.totalAmount;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, validated.totalAmount);

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

import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: null, min: 0 },
    maxUses: { type: Number, default: null, min: 0 },
    usedCount: { type: Number, default: 0, required: true, min: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;

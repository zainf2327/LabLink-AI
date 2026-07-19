import mongoose, { Schema } from 'mongoose';
const CouponSchema = new Schema({
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
}, {
    timestamps: true,
});
const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;

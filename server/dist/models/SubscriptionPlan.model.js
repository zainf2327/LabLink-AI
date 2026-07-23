import mongoose, { Schema } from 'mongoose';
const SubscriptionPlanSchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    maxFamilyMembers: { type: Number, required: true, min: 0 },
    features: [{ type: String, required: true, trim: true }],
    isActive: { type: Boolean, default: true, required: true },
    durationMonths: { type: Number, default: null },
    isDefault: { type: Boolean, default: false, required: true },
    testDiscountPercent: { type: Number, default: 0, min: 0 },
    freeHomeCollections: { type: Boolean, default: false, required: true },
    aiQuestionsPerMonth: { type: Number, default: 0, min: 0 },
}, {
    timestamps: true,
});
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
export default SubscriptionPlan;

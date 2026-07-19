import mongoose, { Schema } from 'mongoose';
const SubscriptionPlanSchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    maxFamilyMembers: { type: Number, required: true, min: 0 },
    features: [{ type: String, required: true, trim: true }],
    isActive: { type: Boolean, default: true, required: true },
}, {
    timestamps: true,
});
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
export default SubscriptionPlan;

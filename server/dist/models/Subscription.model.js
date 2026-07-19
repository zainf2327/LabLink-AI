import mongoose, { Schema } from 'mongoose';
const SubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        required: true,
        default: 'active',
    },
    startDate: { type: Date, required: true, default: Date.now },
    renewalDate: { type: Date, required: true },
}, {
    timestamps: true,
});
// Indexes for query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;

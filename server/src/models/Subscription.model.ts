import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  renewalDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;

import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  expiryDate: Date | null;
  autoRenew: boolean;
  activeFamilyMemberIds: mongoose.Types.ObjectId[];
  needsFamilySelection: boolean;
  planSnapshot: {
    price: number;
    name: string;
    durationMonths: number | null;
    testDiscountPercent: number;
    freeHomeCollections: boolean;
    aiQuestionsPerMonth: number;
    maxFamilyMembers: number;
  };
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
    expiryDate: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false, required: true },
    activeFamilyMemberIds: [{ type: Schema.Types.ObjectId, ref: 'FamilyMember', default: [] }],
    needsFamilySelection: { type: Boolean, default: false, required: true },
    planSnapshot: {
      price: { type: Number, required: true },
      name: { type: String, required: true },
      durationMonths: { type: Number, default: null },
      testDiscountPercent: { type: Number, default: 0 },
      freeHomeCollections: { type: Boolean, default: false },
      aiQuestionsPerMonth: { type: Number, default: 0 },
      maxFamilyMembers: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });

// Database-level constraint: enforce only one active subscription per user
SubscriptionSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;

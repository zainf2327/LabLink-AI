import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  bookingId?: mongoose.Types.ObjectId | null;
  subscriptionPlanId?: mongoose.Types.ObjectId | null;
  subscriptionId?: mongoose.Types.ObjectId | null;
  paymentFor: 'booking' | 'subscription';
  patientId: mongoose.Types.ObjectId;
  amount: number;
  walletAmountUsed: number;
  currency: string;
  method: 'stripe';
  stripePaymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed';
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, default: null },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: false, default: null },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: false, default: null },
    paymentFor: {
      type: String,
      enum: ['booking', 'subscription'],
      required: true,
      default: 'booking',
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    walletAmountUsed: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'usd' },
    method: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
      required: true,
    },
    stripePaymentIntentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending',
      required: true,
    },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ subscriptionPlanId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;

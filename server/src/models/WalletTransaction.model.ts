import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  reason: 'cancellation_refund' | 'booking_payment' | 'subscription_payment';
  bookingId?: mongoose.Types.ObjectId | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ['cancellation_refund', 'booking_payment', 'subscription_payment'],
      required: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    note: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast patient ledger queries
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ bookingId: 1 });

const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  WalletTransactionSchema
);

export default WalletTransaction;

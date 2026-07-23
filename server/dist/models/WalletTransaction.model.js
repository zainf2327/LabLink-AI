import mongoose, { Schema } from 'mongoose';
const WalletTransactionSchema = new Schema({
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
}, {
    timestamps: true,
});
// Indexes for fast patient ledger queries
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ bookingId: 1 });
const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);
export default WalletTransaction;

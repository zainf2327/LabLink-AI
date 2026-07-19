import mongoose, { Schema } from 'mongoose';
const PaymentSchema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
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
}, {
    timestamps: true,
});
// Indexes
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;

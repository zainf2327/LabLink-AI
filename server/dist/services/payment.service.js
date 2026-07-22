import Payment from '../models/Payment.model.js';
import Booking from '../models/Booking.model.js';
import Coupon from '../models/Coupon.model.js';
import User from '../models/User.model.js';
import WalletTransaction from '../models/WalletTransaction.model.js';
import { stripeService } from './stripe.service.js';
import { AppError } from '../utils/AppError.js';
export const paymentService = {
    async createPaymentIntent(patientId, bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }
        if (booking.patientId.toString() !== patientId) {
            throw new AppError('Forbidden: Booking does not belong to you', 403);
        }
        if (booking.status !== 'pending_payment') {
            throw new AppError('Booking is not in pending_payment status', 400);
        }
        // --- Fetch patient wallet balance ---
        const patient = await User.findById(patientId);
        if (!patient) {
            throw new AppError('Patient not found', 404);
        }
        // If wallet already applied for this booking (retry scenario), respect existing walletAmountUsed
        const alreadyAppliedWallet = booking.walletAmountUsed > 0;
        // Determine how much wallet can cover (capped at finalAmount)
        const walletCover = alreadyAppliedWallet
            ? booking.walletAmountUsed
            : Math.min(patient.walletBalance, booking.finalAmount);
        const stripeAmount = booking.finalAmount - walletCover;
        // 1. Zero-value check (after wallet deduction)
        if (stripeAmount === 0 || booking.finalAmount === 0) {
            // Check if we already processed this
            const existingBypassPayment = await Payment.findOne({
                bookingId,
                stripePaymentIntentId: 'bypass_zero_amount',
            });
            if (existingBypassPayment) {
                return {
                    clientSecret: null,
                    paymentId: existingBypassPayment._id.toString(),
                    walletAmountUsed: booking.walletAmountUsed,
                    stripeAmount: 0,
                };
            }
            // Deduct wallet if covering full amount
            if (!alreadyAppliedWallet && walletCover > 0) {
                await paymentService.deductWallet(patient, walletCover, booking);
            }
            const payment = new Payment({
                bookingId: booking._id,
                patientId: booking.patientId,
                amount: 0,
                currency: 'usd',
                method: 'stripe',
                stripePaymentIntentId: 'bypass_zero_amount',
                status: 'succeeded',
                paidAt: new Date(),
            });
            await payment.save();
            // Transition booking to scheduled
            if (booking.status === 'pending_payment') {
                booking.status = 'scheduled';
                await booking.save();
            }
            // Increment coupon usedCount if applied
            if (booking.couponId) {
                const coupon = await Coupon.findById(booking.couponId);
                if (coupon) {
                    coupon.usedCount += 1;
                    await coupon.save();
                }
            }
            // Sync to Google Calendar
            try {
                const { bookingService: bService } = await import('./booking.service.js');
                await bService.syncBookingToCalendar(booking);
            }
            catch (err) {
                console.error('Failed to sync to Google Calendar on zero payment:', err);
            }
            return { clientSecret: null, paymentId: payment._id.toString(), walletAmountUsed: walletCover, stripeAmount: 0 };
        }
        // 2. Check for existing payment record (retry flow)
        const existingPayment = await Payment.findOne({ bookingId });
        if (existingPayment) {
            if (existingPayment.status === 'succeeded') {
                throw new AppError('Payment already completed for this booking', 400);
            }
            // Retrieve existing PaymentIntent details from Stripe
            try {
                const stripeIntent = await stripeService.retrievePaymentIntent(existingPayment.stripePaymentIntentId);
                return {
                    clientSecret: stripeIntent.client_secret,
                    paymentId: existingPayment._id.toString(),
                    walletAmountUsed: booking.walletAmountUsed,
                    stripeAmount,
                };
            }
            catch (err) {
                console.warn('Failed to retrieve existing Stripe PaymentIntent. Creating new one...');
            }
        }
        // 3. Deduct wallet balance before creating Stripe intent (if wallet covers partial amount)
        if (!alreadyAppliedWallet && walletCover > 0) {
            await paymentService.deductWallet(patient, walletCover, booking);
        }
        // 4. Create Stripe PaymentIntent for the remaining amount
        const amountInCents = Math.round(stripeAmount * 100);
        const intent = await stripeService.createPaymentIntent(amountInCents, 'usd', booking._id.toString(), `booking_${bookingId}`);
        let paymentDoc;
        if (existingPayment) {
            existingPayment.stripePaymentIntentId = intent.id;
            existingPayment.status = 'pending';
            paymentDoc = await existingPayment.save();
        }
        else {
            paymentDoc = new Payment({
                bookingId: booking._id,
                patientId: booking.patientId,
                amount: stripeAmount,
                currency: 'usd',
                method: 'stripe',
                stripePaymentIntentId: intent.id,
                status: 'pending',
            });
            await paymentDoc.save();
        }
        return {
            clientSecret: intent.client_secret,
            paymentId: paymentDoc._id.toString(),
            walletAmountUsed: alreadyAppliedWallet ? booking.walletAmountUsed : walletCover,
            stripeAmount,
        };
    },
    /**
     * Deducts walletCover from patient's wallet balance, updates booking.walletAmountUsed,
     * and writes a 'debit' WalletTransaction record. All within a single atomic-ish sequence
     * (no distributed transaction — acceptable for v1 since these are idempotency-safe).
     */
    async deductWallet(patient, amount, booking) {
        if (amount <= 0)
            return;
        // Atomic: decrement wallet balance using $inc to avoid race conditions
        await User.findByIdAndUpdate(patient._id, { $inc: { walletBalance: -amount } }, { returnDocument: 'after' });
        // Update booking to record how much wallet contributed
        booking.walletAmountUsed = amount;
        await booking.save();
        // Write debit ledger entry
        const txn = new WalletTransaction({
            userId: patient._id,
            type: 'debit',
            amount,
            reason: 'booking_payment',
            bookingId: booking._id,
            note: `Wallet deducted for booking ${booking._id.toString()}`,
        });
        await txn.save();
    },
    /**
     * Credits refund amount back to the patient's wallet when a booking is cancelled.
     * Called from booking.controller.ts after setting booking.status = 'cancelled'.
     */
    async creditWalletOnCancellation(booking) {
        // Only credit if booking was paid (finalAmount > 0)
        if (booking.finalAmount <= 0)
            return;
        // Only credit if booking had reached 'scheduled' or beyond (i.e., payment was taken)
        // The caller (cancelBooking controller) is responsible for checking this precondition.
        const refundAmount = booking.finalAmount;
        // Credit patient wallet using $inc for atomicity
        await User.findByIdAndUpdate(booking.patientId, { $inc: { walletBalance: refundAmount } }, { returnDocument: 'after' });
        // Write credit ledger entry
        const txn = new WalletTransaction({
            userId: booking.patientId,
            type: 'credit',
            amount: refundAmount,
            reason: 'cancellation_refund',
            bookingId: booking._id,
            note: `Wallet credited for cancellation of booking ${booking._id.toString()}`,
        });
        await txn.save();
    },
    async confirmPayment(patientId, paymentIntentId) {
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment) {
            throw new AppError('Payment record not found', 404);
        }
        if (payment.patientId.toString() !== patientId) {
            throw new AppError('Forbidden: Payment does not belong to you', 403);
        }
        const booking = await Booking.findById(payment.bookingId);
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }
        // Delegate to shared processor
        await paymentService.processSuccessfulPayment(paymentIntentId);
        // Fetch the updated booking to return
        const updatedBooking = await Booking.findById(payment.bookingId);
        if (!updatedBooking) {
            throw new AppError('Booking not found', 404);
        }
        // Check if the payment actually succeeded
        const updatedPayment = await Payment.findById(payment._id);
        if (updatedPayment?.status !== 'succeeded') {
            throw new AppError('Payment not succeeded or still processing', 400);
        }
        return updatedBooking;
    },
    async processSuccessfulPayment(paymentIntentId) {
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment || payment.status === 'succeeded')
            return;
        const booking = await Booking.findById(payment.bookingId);
        if (!booking)
            return;
        // Verify PaymentIntent with Stripe
        const stripeIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
        if (stripeIntent.status !== 'succeeded') {
            payment.status = 'failed';
            await payment.save();
            return;
        }
        // 1. Complete payment
        payment.status = 'succeeded';
        payment.paidAt = new Date();
        await payment.save();
        // 2. Update coupon count if coupon applied
        if (booking.couponId) {
            const coupon = await Coupon.findById(booking.couponId);
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }
        // 3. Sync to Google Calendar
        try {
            const { bookingService } = await import('./booking.service.js');
            await bookingService.syncBookingToCalendar(booking);
        }
        catch (err) {
            console.error('Failed to sync to Google Calendar:', err);
        }
        // 4. Update booking status
        if (booking.status === 'pending_payment') {
            booking.status = 'scheduled';
            await booking.save();
        }
    },
};

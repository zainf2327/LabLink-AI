import mongoose from 'mongoose';
import Payment from '../models/Payment.model.js';
import Booking, { IBooking } from '../models/Booking.model.js';
import Coupon from '../models/Coupon.model.js';
import { stripeService } from './stripe.service.js';
import { calendarService } from './calendar.service.js';

export const paymentService = {
  async createPaymentIntent(
    patientId: string,
    bookingId: string
  ): Promise<{ clientSecret: string | null; paymentId: string }> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found') as any;
      error.statusCode = 404;
      throw error;
    }

    if (booking.patientId.toString() !== patientId) {
      const error = new Error('Forbidden: Booking does not belong to you') as any;
      error.statusCode = 403;
      throw error;
    }

    if (booking.status !== 'pending_payment') {
      const error = new Error('Booking is not in pending_payment status') as any;
      error.statusCode = 400;
      throw error;
    }

    // 1. Zero-value check
    if (booking.finalAmount === 0) {
      const existingBypassPayment = await Payment.findOne({
        bookingId,
        stripePaymentIntentId: 'bypass_zero_amount',
      });
      if (existingBypassPayment) {
        return { clientSecret: null, paymentId: existingBypassPayment._id.toString() };
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
      return { clientSecret: null, paymentId: payment._id.toString() };
    }

    // 2. Check for existing payment record
    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment) {
      if (existingPayment.status === 'succeeded') {
        const error = new Error('Payment already completed for this booking') as any;
        error.statusCode = 400;
        throw error;
      }

      // Retrieve existing PaymentIntent details from Stripe
      try {
        const stripeIntent = await stripeService.retrievePaymentIntent(
          existingPayment.stripePaymentIntentId
        );
        return {
          clientSecret: stripeIntent.client_secret,
          paymentId: existingPayment._id.toString(),
        };
      } catch (err) {
        console.warn('Failed to retrieve existing Stripe PaymentIntent. Creating new one...');
      }
    }

    // 3. Create Stripe PaymentIntent
    const amountInCents = Math.round(booking.finalAmount * 100);
    const intent = await stripeService.createPaymentIntent(
      amountInCents,
      'usd',
      booking._id.toString()
    );

    let paymentDoc;
    if (existingPayment) {
      existingPayment.stripePaymentIntentId = intent.id;
      existingPayment.status = 'pending';
      paymentDoc = await existingPayment.save();
    } else {
      paymentDoc = new Payment({
        bookingId: booking._id,
        patientId: booking.patientId,
        amount: booking.finalAmount,
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
    };
  },

  async confirmPayment(patientId: string, paymentIntentId: string): Promise<IBooking> {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      const error = new Error('Payment record not found') as any;
      error.statusCode = 404;
      throw error;
    }

    if (payment.patientId.toString() !== patientId) {
      const error = new Error('Forbidden: Payment does not belong to you') as any;
      error.statusCode = 403;
      throw error;
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      const error = new Error('Booking not found') as any;
      error.statusCode = 404;
      throw error;
    }

    // Delegate to shared processor
    await paymentService.processSuccessfulPayment(paymentIntentId);

    // Fetch the updated booking to return
    const updatedBooking = await Booking.findById(payment.bookingId);
    if (!updatedBooking) {
      const error = new Error('Booking not found') as any;
      error.statusCode = 404;
      throw error;
    }

    // Check if the payment actually succeeded
    const updatedPayment = await Payment.findById(payment._id);
    if (updatedPayment?.status !== 'succeeded') {
      const error = new Error('Payment not succeeded or still processing') as any;
      error.statusCode = 400;
      throw error;
    }

    return updatedBooking;
  },

  async processSuccessfulPayment(paymentIntentId: string): Promise<void> {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment || payment.status === 'succeeded') return;

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) return;

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
    } catch (err) {
      console.error('Failed to sync to Google Calendar:', err);
    }

    // 4. Update booking status
    if (booking.status === 'pending_payment') {
      booking.status = 'scheduled';
      await booking.save();
    }
  },
};

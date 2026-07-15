import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking.model.js';
import Test from '../models/Test.model.js';
import Coupon from '../models/Coupon.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Subscription from '../models/Subscription.model.js';
import Payment from '../models/Payment.model.js';
import { stripeService } from './stripe.service.js';
import { calendarService } from './calendar.service.js';

export const bookingService = {
  async createBooking(
    patientId: string,
    data: {
      forMemberId?: string | null;
      tests: string[];
      couponCode?: string | null;
      homeSampling?: {
        requested: boolean;
        address?: string;
        scheduledAt?: string;
      };
      notes?: string;
    }
  ): Promise<IBooking> {
    const { forMemberId, tests, couponCode, homeSampling, notes } = data;

    // 1. Validate tests array
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      const error = new Error('Booking must contain at least one test') as any;
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch selected tests and verify active
    const foundTests = await Test.find({ _id: { $in: tests } });
    if (foundTests.length !== tests.length) {
      const error = new Error('One or more selected tests do not exist') as any;
      error.statusCode = 400;
      throw error;
    }

    const inactiveTest = foundTests.find((t) => !t.isActive);
    if (inactiveTest) {
      const error = new Error(`Test "${inactiveTest.name}" is not active`) as any;
      error.statusCode = 400;
      throw error;
    }

    // 3. If forMemberId is provided, validate family member and subscription gate
    if (forMemberId) {
      const familyMember = await FamilyMember.findById(forMemberId);
      if (!familyMember) {
        const error = new Error('Family member not found') as any;
        error.statusCode = 400;
        throw error;
      }
      if (familyMember.userId.toString() !== patientId) {
        const error = new Error('Forbidden: Family member does not belong to you') as any;
        error.statusCode = 403;
        throw error;
      }

      // Check active subscription family-member gate
      const activeSubscription = await Subscription.findOne({
        userId: patientId,
        status: 'active',
      }).populate('planId');

      if (!activeSubscription) {
        const error = new Error(
          'An active subscription is required to book for family members.'
        ) as any;
        error.statusCode = 403;
        throw error;
      }

      const plan = activeSubscription.planId as any;
      const familyCount = await FamilyMember.countDocuments({ userId: patientId });

      if (familyCount > plan.maxFamilyMembers) {
        const error = new Error(
          `Your active subscription allows a maximum of ${plan.maxFamilyMembers} family members.`
        ) as any;
        error.statusCode = 403;
        throw error;
      }
    }

    // 4. Validate home sampling if requested
    if (homeSampling?.requested) {
      if (!homeSampling.address || !homeSampling.scheduledAt) {
        const error = new Error(
          'Address and appointment slot are required for home sampling'
        ) as any;
        error.statusCode = 400;
        throw error;
      }

      const appointmentDate = new Date(homeSampling.scheduledAt);
      if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
        const error = new Error('Home sampling slot must be in the future') as any;
        error.statusCode = 400;
        throw error;
      }

      const nonHomeCollectionTest = foundTests.find((t) => !t.isHomeCollectionAvailable);
      if (nonHomeCollectionTest) {
        const error = new Error(
          `Home collection is not available for test: "${nonHomeCollectionTest.name}"`
        ) as any;
        error.statusCode = 400;
        throw error;
      }
    }

    // 5. Snapshot test price and name
    const snapshotTests = foundTests.map((t) => ({
      testId: t._id as mongoose.Types.ObjectId,
      name: t.name,
      price: t.price,
    }));

    // 6. Calculate totalAmount
    const totalAmount = snapshotTests.reduce((sum, t) => sum + t.price, 0);

    // 7. Validate coupon if provided
    let discountAmount = 0;
    let couponId: mongoose.Types.ObjectId | null = null;
    let couponDoc = null;

    if (couponCode) {
      couponDoc = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!couponDoc) {
        const error = new Error('Invalid or inactive coupon code') as any;
        error.statusCode = 400;
        throw error;
      }

      if (couponDoc.expiresAt && new Date(couponDoc.expiresAt) < new Date()) {
        const error = new Error('Coupon code has expired') as any;
        error.statusCode = 400;
        throw error;
      }

      if (
        couponDoc.maxUses !== undefined &&
        couponDoc.maxUses !== null &&
        couponDoc.usedCount >= couponDoc.maxUses
      ) {
        const error = new Error('Coupon usage limit reached') as any;
        error.statusCode = 400;
        throw error;
      }

      if (
        couponDoc.minOrderValue !== undefined &&
        couponDoc.minOrderValue !== null &&
        totalAmount < couponDoc.minOrderValue
      ) {
        const error = new Error(
          `Minimum order value for coupon is $${couponDoc.minOrderValue}`
        ) as any;
        error.statusCode = 400;
        throw error;
      }

      // Calculate discount amount
      if (couponDoc.discountType === 'percentage') {
        discountAmount = (couponDoc.discountValue / 100) * totalAmount;
      } else {
        discountAmount = couponDoc.discountValue;
      }

      discountAmount = Math.min(discountAmount, totalAmount);
      couponId = couponDoc._id as mongoose.Types.ObjectId;
    }

    // 8. Calculate finalAmount
    const finalAmount = totalAmount - discountAmount;

    // 9. Create Booking
    const booking = new Booking({
      patientId: new mongoose.Types.ObjectId(patientId),
      forMemberId: forMemberId ? new mongoose.Types.ObjectId(forMemberId) : null,
      tests: snapshotTests,
      status: 'pending_payment',
      totalAmount,
      discountAmount,
      finalAmount,
      couponId,
      homeSampling: {
        requested: homeSampling?.requested || false,
        address: homeSampling?.address || '',
        scheduledAt: homeSampling?.scheduledAt ? new Date(homeSampling.scheduledAt) : undefined,
        assignedStaffId: null,
        calendarEventId: null,
      },
      notes: notes || '',
    });

    await booking.save();

    // 10. Handle Zero-Value Checkout Bypass
    if (finalAmount === 0) {
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

      booking.status = 'scheduled';

      // Increment coupon usedCount immediately since checkout is completed
      if (couponDoc) {
        couponDoc.usedCount += 1;
        await couponDoc.save();
      }

      // Create calendar event if requested
      if (booking.homeSampling.requested && booking.homeSampling.scheduledAt) {
        const eventId = await calendarService.createHomeSamplingEvent(
          'Patient',
          booking.homeSampling.address || '',
          booking.homeSampling.scheduledAt
        );
        booking.homeSampling.calendarEventId = eventId;
      }

      await booking.save();
    }

    return booking;
  },

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
    await bookingService.processSuccessfulPayment(paymentIntentId);

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

    // 3. Create Google Calendar event if requested
    if (booking.homeSampling.requested && booking.homeSampling.scheduledAt && !booking.homeSampling.calendarEventId) {
      try {
        const eventId = await calendarService.createHomeSamplingEvent(
          'Patient',
          booking.homeSampling.address || '',
          booking.homeSampling.scheduledAt
        );
        booking.homeSampling.calendarEventId = eventId;
      } catch (err) {
        console.error('Failed to create calendar event in webhook:', err);
      }
    }

    // 4. Update booking status
    if (booking.status === 'pending_payment') {
      booking.status = 'scheduled';
      await booking.save();
    }
  },
};

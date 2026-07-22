import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking.model.js';
import Test from '../models/Test.model.js';
import Coupon from '../models/Coupon.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Subscription from '../models/Subscription.model.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import { calendarService } from './calendar.service.js';
import { AppError } from '../utils/AppError.js';


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
      throw new AppError('Booking must contain at least one test', 400);
    }

    // 2. Fetch selected tests and verify active
    const foundTests = await Test.find({ _id: { $in: tests } });
    if (foundTests.length !== tests.length) {
      throw new AppError('One or more selected tests do not exist', 400);
    }

    const inactiveTest = foundTests.find((t) => !t.isActive);
    if (inactiveTest) {
      throw new AppError(`Test "${inactiveTest.name}" is not active`, 400);
    }

    // 3. If forMemberId is provided, validate family member and subscription gate
    if (forMemberId) {
      const familyMember = await FamilyMember.findById(forMemberId);
      if (!familyMember) {
        throw new AppError('Family member not found', 400);
      }
      if (familyMember.userId.toString() !== patientId) {
        throw new AppError('Forbidden: Family member does not belong to you', 403);
      }

      // Check active subscription family-member gate
      const activeSubscription = await Subscription.findOne({
        userId: patientId,
        status: 'active',
      }).populate('planId');

      if (!activeSubscription) {
        throw new AppError(
          'An active subscription is required to book for family members.',
          403
        );
      }

      const plan = activeSubscription.planId as any;
      const familyCount = await FamilyMember.countDocuments({ userId: patientId });

      if (familyCount > plan.maxFamilyMembers) {
        throw new AppError(
          `Your active subscription allows a maximum of ${plan.maxFamilyMembers} family members.`,
          403
        );
      }
    }

    // 4. Validate scheduling details
    if (homeSampling) {
      if (homeSampling.requested) {
        if (!homeSampling.address) {
          throw new AppError('Address is required for home sampling', 400);
        }

        const nonHomeCollectionTest = foundTests.find((t) => !t.isHomeCollectionAvailable);
        if (nonHomeCollectionTest) {
          throw new AppError(
            `Home collection is not available for test: "${nonHomeCollectionTest.name}"`,
            400
          );
        }
      }

      if (!homeSampling.scheduledAt) {
        throw new AppError('Appointment slot date and time is required', 400);
      }

      const appointmentDate = new Date(homeSampling.scheduledAt);
      if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
        throw new AppError('Appointment slot must be in the future', 400);
      }
    } else {
      throw new AppError('Scheduling details are required', 400);
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
        throw new AppError('Invalid or inactive coupon code', 400);
      }

      if (couponDoc.expiresAt && new Date(couponDoc.expiresAt) < new Date()) {
        throw new AppError('Coupon code has expired', 400);
      }

      if (
        couponDoc.maxUses !== undefined &&
        couponDoc.maxUses !== null &&
        couponDoc.usedCount >= couponDoc.maxUses
      ) {
        throw new AppError('Coupon usage limit reached', 400);
      }

      if (
        couponDoc.minOrderValue !== undefined &&
        couponDoc.minOrderValue !== null &&
        totalAmount < couponDoc.minOrderValue
      ) {
        throw new AppError(
          `Minimum order value for coupon is $${couponDoc.minOrderValue}`,
          400
        );
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

      await booking.save();

      // Sync to Google Calendar if patient has connected it
      try {
        await bookingService.syncBookingToCalendar(booking);
      } catch (err) {
        console.error('Failed to sync to Google Calendar:', err);
      }
    }

    return booking;
  },

  async checkStaffConflict(
    staffId: string,
    scheduledAt: Date,
    excludeBookingId?: string
  ): Promise<void> {
    // 1. Local database conflict checking (2 hours window: 1 hour before and after)
    const buffer = 60 * 60 * 1000; // 1 hour
    const startTime = new Date(scheduledAt.getTime() - buffer);
    const endTime = new Date(scheduledAt.getTime() + buffer);

    const query: any = {
      'homeSampling.assignedStaffId': staffId,
      status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] },
      'homeSampling.scheduledAt': { $gte: startTime, $lte: endTime },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);
    if (conflictingBooking) {
      throw new AppError(
        'Staff member has a scheduling conflict in the database at this time.',
        409
      );
    }

    // 2. Google Calendar conflict checking (FreeBusy API)
    const staff = await User.findById(staffId);
    if (staff && staff.googleCalendarConnected && staff.googleRefreshToken) {
      const { decrypt } = await import('../utils/crypto.js');
      const decryptedToken = decrypt(staff.googleRefreshToken);
      
      const isBusy = await calendarService.checkFreeBusy(
        decryptedToken,
        staff.googleEmail || staff.email,
        startTime,
        endTime
      );

      if (isBusy) {
        throw new AppError(
          'Staff member has a scheduling conflict on Google Calendar.',
          409
        );
      }
    }
  },

  async syncBookingToCalendar(booking: IBooking): Promise<void> {
    if (!booking.homeSampling.requested || !booking.homeSampling.scheduledAt || booking.status !== 'scheduled') {
      return;
    }

    const { decrypt } = await import('../utils/crypto.js');
    
    let updated = false;

    // 1. Patient Event Sync
    const patient = await User.findById(booking.patientId);
    if (
      patient &&
      patient.googleCalendarConnected &&
      patient.googleRefreshToken &&
      !booking.googleCalendar?.patientEventId
    ) {
      try {
        const decryptedToken = decrypt(patient.googleRefreshToken);
        const eventId = await calendarService.createHomeSamplingEvent(
          decryptedToken,
          patient.name,
          booking.homeSampling.address || '',
          booking.homeSampling.scheduledAt
        );
        
        if (!booking.googleCalendar) {
          booking.googleCalendar = { patientEventId: null, staffEventId: null };
        }
        booking.googleCalendar.patientEventId = eventId;
        updated = true;
      } catch (err: any) {
        console.error(`Failed to sync calendar event for patient ${patient._id}:`, err);
        if (err.message && (err.message.includes('invalid_grant') || err.message.includes('auth'))) {
          patient.googleCalendarConnected = false;
          await patient.save();
        }
      }
    }

    // 2. Staff Event Sync
    if (
      booking.homeSampling.requested &&
      booking.homeSampling.assignedStaffId &&
      booking.homeSampling.scheduledAt &&
      !booking.googleCalendar?.staffEventId
    ) {
      const staff = await User.findById(booking.homeSampling.assignedStaffId);
      if (staff && staff.googleCalendarConnected && staff.googleRefreshToken) {
        try {
          const decryptedToken = decrypt(staff.googleRefreshToken);
          const patientName = patient?.name || 'Patient';
          
          const eventId = await calendarService.createHomeSamplingEvent(
            decryptedToken,
            patientName,
            booking.homeSampling.address || '',
            booking.homeSampling.scheduledAt
          );
          
          if (!booking.googleCalendar) {
            booking.googleCalendar = { patientEventId: null, staffEventId: null };
          }
          booking.googleCalendar.staffEventId = eventId;
          updated = true;
        } catch (err: any) {
          console.error(`Failed to sync calendar event for staff ${staff._id}:`, err);
          if (err.message && (err.message.includes('invalid_grant') || err.message.includes('auth'))) {
            staff.googleCalendarConnected = false;
            await staff.save();
          }
        }
      }
    }

    if (updated) {
      booking.markModified('googleCalendar');
      await booking.save();
    }
  },

  async removeCalendarEvents(booking: IBooking): Promise<void> {
    const { decrypt } = await import('../utils/crypto.js');
    
    let updated = false;

    if (booking.googleCalendar?.patientEventId) {
      const patient = await User.findById(booking.patientId);
      if (patient && patient.googleCalendarConnected && patient.googleRefreshToken) {
        try {
          const decryptedToken = decrypt(patient.googleRefreshToken);
          await calendarService.deleteEvent(decryptedToken, booking.googleCalendar.patientEventId);
        } catch (err) {
          console.error('Failed to delete patient calendar event:', err);
        }
      }
      booking.googleCalendar.patientEventId = null;
      updated = true;
    }

    if (booking.googleCalendar?.staffEventId && booking.homeSampling.assignedStaffId) {
      const staff = await User.findById(booking.homeSampling.assignedStaffId);
      if (staff && staff.googleCalendarConnected && staff.googleRefreshToken) {
        try {
          const decryptedToken = decrypt(staff.googleRefreshToken);
          await calendarService.deleteEvent(decryptedToken, booking.googleCalendar.staffEventId);
        } catch (err) {
          console.error('Failed to delete staff calendar event:', err);
        }
      }
      booking.googleCalendar.staffEventId = null;
      updated = true;
    }

    if (updated) {
      booking.markModified('googleCalendar');
      await booking.save();
    }
  },
};


import mongoose from 'mongoose';
import Notification from '../models/Notification.model.js';

/**
 * Creates a persistent notification for a specific user.
 * Catches errors internally to prevent failing the parent transaction.
 */
export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: 'booking' | 'report' | 'subscription' | 'general' = 'general',
  bookingId?: string | mongoose.Types.ObjectId
) => {
  try {
    const notification = new Notification({
      userId,
      bookingId,
      title,
      message,
      type,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating user notification:', err);
    return null;
  }
};

/**
 * Helper to notify a patient that their booking has been created successfully.
 */
export const notifyBookingCreated = async (userId: string, bookingId: string) => {
  const Booking = (await import('../models/Booking.model.js')).default;
  const booking = await Booking.findById(bookingId).populate('tests');
  const testNames = booking ? booking.tests.map((t: any) => t.name).join(', ') : '';
  const displayStr = testNames ? `${testNames} (#${bookingId.slice(-6).toUpperCase()})` : `#${bookingId.slice(-6).toUpperCase()}`;

  return createNotification(
    userId,
    'Booking Placed Successfully',
    `Your booking for ${displayStr} has been placed and is pending schedule.`,
    'booking',
    bookingId
  );
};

/**
 * Helper to notify a staff member they have been assigned to a booking.
 */
export const notifyBookingAssigned = async (staffId: string, bookingId: string, scheduledAt: Date) => {
  const Booking = (await import('../models/Booking.model.js')).default;
  const User = (await import('../models/User.model.js')).default;

  const booking = await Booking.findById(bookingId).populate('patientId').populate('tests');
  const staff = await User.findById(staffId);

  const patientName = booking && (booking.patientId as any) ? (booking.patientId as any).name : 'Patient';
  const displayStr = `${patientName} (#${bookingId.slice(-6).toUpperCase()})`;
  const formattedDate = new Date(scheduledAt).toLocaleString();

  const notification = await createNotification(
    staffId,
    'New Booking Assignment',
    `You have been assigned to collect samples for Booking: ${displayStr} scheduled at ${formattedDate}.`,
    'booking',
    bookingId
  );

  // Send the email to the staff member
  if (staff && staff.email) {
    try {
      const { emailService } = await import('./email.service.js');
      const address = booking?.homeSampling?.address || 'Not specified';
      const testNames = booking ? booking.tests.map((t: any) => t.name) : [];

      emailService.sendBookingAssignmentEmail(
        staff.email,
        staff.name,
        bookingId,
        scheduledAt,
        patientName,
        address,
        testNames
      ).catch((err) => {
        console.error('Failed to send booking assignment email to staff:', err);
      });
    } catch (emailErr) {
      console.error('Failed to import emailService or trigger assignment email:', emailErr);
    }
  }

  return notification;
};

/**
 * Helper to notify a patient and/or staff that a booking has been cancelled.
 */
export const notifyBookingCancelled = async (userId: string, bookingId: string, reason?: string) => {
  const Booking = (await import('../models/Booking.model.js')).default;
  const booking = await Booking.findById(bookingId).populate('tests');
  const testNames = booking ? booking.tests.map((t: any) => t.name).join(', ') : '';
  const displayStr = testNames ? `${testNames} (#${bookingId.slice(-6).toUpperCase()})` : `#${bookingId.slice(-6).toUpperCase()}`;

  const message = reason 
    ? `Your booking for ${displayStr} was cancelled. Reason: ${reason}`
    : `Your booking for ${displayStr} has been cancelled.`;

  return createNotification(userId, 'Booking Cancelled', message, 'booking', bookingId);
};

/**
 * Helper to notify a patient that their test report is ready.
 */
export const notifyReportReady = async (userId: string, bookingId: string) => {
  const Booking = (await import('../models/Booking.model.js')).default;
  const booking = await Booking.findById(bookingId).populate('tests');
  const testNames = booking ? booking.tests.map((t: any) => t.name).join(', ') : '';
  const displayStr = testNames ? `${testNames} (#${bookingId.slice(-6).toUpperCase()})` : `#${bookingId.slice(-6).toUpperCase()}`;

  return createNotification(
    userId,
    'Diagnostic Report Ready',
    `Your diagnostic report for ${displayStr} is now ready. You can view or download it from your dashboard.`,
    'report',
    bookingId
  );
};

/**
 * Helper to notify a patient that their subscription plan has been activated.
 */
export const notifySubscriptionPurchased = async (userId: string, planName: string) => {
  return createNotification(
    userId,
    'Subscription Plan Activated',
    `Thank you for subscribing! Your ${planName} plan is now active. Enjoy premium features and diagnostic tracking.`,
    'subscription'
  );
};

/**
 * Helper to notify all administrators that a booking requires manual assignment.
 */
export const notifyAdminsPendingAssignment = async (bookingId: string) => {
  const User = (await import('../models/User.model.js')).default;
  const Booking = (await import('../models/Booking.model.js')).default;
  try {
    const booking = await Booking.findById(bookingId).populate('patientId');
    const patientName = booking && (booking.patientId as any) ? (booking.patientId as any).name : 'Patient';
    const displayStr = `${patientName} (#${bookingId.slice(-6).toUpperCase()})`;

    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'Action Required: Manual Assignment',
        `Booking for ${displayStr} could not be auto-assigned and requires manual staff assignment.`,
        'booking',
        bookingId
      );
    }
  } catch (err) {
    console.error('Failed to notify admins of pending manual assignment:', err);
  }
};

/**
 * Helper to notify a patient that their wallet has been topped up.
 */
export const notifyWalletTopUp = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Wallet Topped Up',
    `$${amount.toFixed(2)} has been added to your wallet balance. Your credits are ready to use on your next booking.`,
    'general'
  );
};

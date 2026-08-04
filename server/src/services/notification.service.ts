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
  type: 'booking' | 'report' | 'subscription' | 'general' = 'general'
) => {
  try {
    const notification = new Notification({
      userId,
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
  return createNotification(
    userId,
    'Booking Placed Successfully',
    `Your booking #${bookingId.slice(-6).toUpperCase()} has been placed and is pending schedule.`,
    'booking'
  );
};

/**
 * Helper to notify a staff member they have been assigned to a booking.
 */
export const notifyBookingAssigned = async (staffId: string, bookingId: string, scheduledAt: Date) => {
  const formattedDate = new Date(scheduledAt).toLocaleString();
  return createNotification(
    staffId,
    'New Booking Assignment',
    `You have been assigned to collect samples for Booking #${bookingId.slice(-6).toUpperCase()} scheduled at ${formattedDate}.`,
    'booking'
  );
};

/**
 * Helper to notify a patient and/or staff that a booking has been cancelled.
 */
export const notifyBookingCancelled = async (userId: string, bookingId: string, reason?: string) => {
  const message = reason 
    ? `Your booking #${bookingId.slice(-6).toUpperCase()} was cancelled. Reason: ${reason}`
    : `Your booking #${bookingId.slice(-6).toUpperCase()} has been cancelled.`;
  return createNotification(userId, 'Booking Cancelled', message, 'booking');
};

/**
 * Helper to notify a patient that their test report is ready.
 */
export const notifyReportReady = async (userId: string, bookingId: string) => {
  return createNotification(
    userId,
    'Diagnostic Report Ready',
    `Your diagnostic report for Booking #${bookingId.slice(-6).toUpperCase()} is now ready. You can view or download it from your dashboard.`,
    'report'
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
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'Action Required: Manual Assignment',
        `Booking #${bookingId.slice(-6).toUpperCase()} could not be auto-assigned and requires manual staff assignment.`,
        'booking'
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

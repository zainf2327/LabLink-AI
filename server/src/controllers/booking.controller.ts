import { Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import { bookingService } from '../services/booking.service.js';
import { paymentService } from '../services/payment.service.js';
import { calendarService } from '../services/calendar.service.js';
import { createBookingSchema, updateBookingStatusSchema, assignStaffSchema } from '../utils/validators.js';
import logger from '../utils/logger.js';


export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const validated = req.body;
  const booking = await bookingService.createBooking(req.user.id, validated);

  // Trigger Booking Placed Notification
  try {
    const { notifyBookingCreated } = await import('../services/notification.service.js');
    await notifyBookingCreated(req.user.id, booking._id.toString());
  } catch (err) {
    logger.error('Failed to trigger booking created notification:', err);
  }

  res.status(201).json({
    success: true,
    data: { booking },
  });
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const total = await Booking.countDocuments({ patientId: req.user.id });
  const bookings = await Booking.find({ patientId: req.user.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // Patient can only view their own bookings
  if (req.user.role === 'patient' && booking.patientId.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Access to another patient\'s booking is denied',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

export const getAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const patientId = req.query.patientId as string;
  const dateStr = req.query.date as string;
  const assignedStaffId = req.query.assignedStaffId as string;
  const type = req.query.type as string; // 'home' | 'lab'
  const search = req.query.search as string;

  const filter: any = {};
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;

  // Filter by assigned staff
  if (assignedStaffId) {
    if (assignedStaffId === 'unassigned') {
      filter['homeSampling.requested'] = true;
      filter['homeSampling.assignedStaffId'] = null;
    } else {
      filter['homeSampling.assignedStaffId'] = assignedStaffId;
    }
  }

  // Filter by booking type
  if (type) {
    filter['homeSampling.requested'] = type === 'home';
  }

  // Filter by date range (today vs specific date vs all)
  if (dateStr) {
    const start = new Date(dateStr === 'today' ? Date.now() : dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr === 'today' ? Date.now() : dateStr);
    end.setHours(23, 59, 59, 999);

    filter.$or = [
      { 'homeSampling.scheduledAt': { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } }
    ];
  }

  // Patient name or Booking ID search query
  if (search) {
    if (mongoose.isValidObjectId(search)) {
      filter._id = search;
    } else {
      const matchedPatients = await User.find({
        name: { $regex: search, $options: 'i' },
        role: 'patient'
      }).select('_id');
      const patientIds = matchedPatients.map((u) => u._id);
      filter.patientId = { $in: patientIds };
    }
  }

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('patientId', 'name email phone')
    .populate('homeSampling.assignedStaffId', 'name email phone');

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const validTransitions: Record<string, string[]> = {
    pending_payment: ['scheduled', 'cancelled', 'pending_manual_assignment'],
    pending_manual_assignment: ['scheduled', 'cancelled'],
    scheduled: ['sample_collected', 'cancelled', 'pending_manual_assignment'],
    sample_collected: ['in_lab', 'cancelled'],
    in_lab: ['report_ready', 'cancelled'],
    report_ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  const currentStatus = booking.status;
  if (currentStatus !== status) {
    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}"`,
      });
      return;
    }
  }

  booking.status = status;
  await booking.save();

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // Patient cancellation rules
  if (req.user.role === 'patient') {
    if (booking.patientId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    if (booking.status !== 'scheduled' && booking.status !== 'pending_manual_assignment') {
      res.status(400).json({
        success: false,
        message: 'Patients can only cancel bookings that are in "scheduled" or "pending_manual_assignment" status',
      });
      return;
    }
  }

  // Staff / Admin cancellation rules
  if (req.user.role === 'staff' || req.user.role === 'admin') {
    if (booking.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that is already completed',
      });
      return;
    }
  }

  // Capture the status BEFORE mutation so wallet logic knows if it was previously paid
  const previousStatus = booking.status;

  booking.status = 'cancelled';
  await booking.save();

  // Credit wallet if booking was already paid (scheduled or beyond)
  const paidStatuses = ['scheduled', 'pending_manual_assignment', 'sample_collected', 'in_lab', 'report_ready'];
  if (paidStatuses.includes(previousStatus) && booking.finalAmount > 0) {
    try {
      await paymentService.creditWalletOnCancellation(booking);
    } catch (err) {
      logger.error('Failed to credit wallet on cancellation:', err);
    }
  }

  // Remove Google Calendar events if any were created
  try {
    await bookingService.removeCalendarEvents(booking);
  } catch (err) {
    logger.error('Failed to remove Google Calendar events on cancel:', err);
  }

  // Trigger Booking Cancelled Notifications
  try {
    const { notifyBookingCancelled } = await import('../services/notification.service.js');
    await notifyBookingCancelled(booking.patientId.toString(), booking._id.toString());
    if (booking.homeSampling?.assignedStaffId) {
      await notifyBookingCancelled(
        booking.homeSampling.assignedStaffId.toString(),
        booking._id.toString(),
        'The booking assigned to you has been cancelled.'
      );
    }
  } catch (err) {
    logger.error('Failed to trigger booking cancelled notifications:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking },
  });
});

export const assignStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { assignedStaffId } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // 1. Check conflict if assigning a staff member
  if (assignedStaffId && booking.homeSampling.scheduledAt) {
    await bookingService.checkStaffConflict(assignedStaffId, booking.homeSampling.scheduledAt, booking._id.toString());
  }

  // 2. Handle reassignment: delete calendar event of old staff member
  const oldStaffId = booking.homeSampling.assignedStaffId;
  if (oldStaffId && oldStaffId.toString() !== assignedStaffId) {
    if (booking.googleCalendar?.staffEventId) {
      const User = (await import('../models/User.model.js')).default;
      const oldStaff = await User.findById(oldStaffId);
      if (oldStaff && oldStaff.googleCalendarConnected && oldStaff.googleRefreshToken) {
        try {
          const { decrypt } = await import('../utils/crypto.js');
          const decryptedToken = decrypt(oldStaff.googleRefreshToken);
          await calendarService.deleteEvent(decryptedToken, booking.googleCalendar.staffEventId);
        } catch (err) {
          logger.error('Failed to delete old staff calendar event:', err);
        }
      }
      if (!booking.googleCalendar) {
        booking.googleCalendar = { patientEventId: null, staffEventId: null };
      }
      booking.googleCalendar.staffEventId = null;
    }
  }

  // 3. Update staff assignment
  booking.homeSampling.assignedStaffId = assignedStaffId
    ? new mongoose.Types.ObjectId(assignedStaffId)
    : null;

  if (booking.status === 'pending_manual_assignment' && assignedStaffId) {
    booking.status = 'scheduled';
  }

  await booking.save();

  // Trigger Staff Assignment & Reassignment Notifications
  try {
    const { notifyBookingAssigned, notifyBookingCancelled } = await import('../services/notification.service.js');
    if (assignedStaffId && booking.homeSampling.scheduledAt) {
      await notifyBookingAssigned(assignedStaffId, booking._id.toString(), booking.homeSampling.scheduledAt);
    }
    if (oldStaffId && oldStaffId.toString() !== assignedStaffId) {
      await notifyBookingCancelled(
        oldStaffId.toString(),
        booking._id.toString(),
        'This booking has been reassigned to another staff member.'
      );
    }
  } catch (err) {
    logger.error('Failed to trigger staff assignment notifications:', err);
  }

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

export const autoAssignBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const booking = await Booking.findById(id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }
  if (!booking.homeSampling.requested) {
    res.status(400).json({ success: false, message: 'Booking does not request home sampling' });
    return;
  }

  const { autoAssignStaff } = await import('../services/autoAssign.service.js');
  const staff = await autoAssignStaff(id);

  if (!staff) {
    res.status(200).json({
      success: true,
      message: 'No eligible staff found. Booking transitioned to pending_manual_assignment.',
      data: { booking: await Booking.findById(id) }
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Staff member ${staff.name} auto-assigned successfully.`,
    data: {
      booking: await Booking.findById(id).populate('homeSampling.assignedStaffId', 'name email phone')
    }
  });
});

export const autoAssignAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Find all home sampling bookings that are scheduled or pending manual assignment but have no staff assigned
  const query = {
    'homeSampling.requested': true,
    'homeSampling.assignedStaffId': null,
    status: { $in: ['scheduled', 'pending_manual_assignment'] as const }
  };

  const unassignedBookings = await Booking.find(query);
  const { autoAssignStaff } = await import('../services/autoAssign.service.js');

  const results = {
    total: unassignedBookings.length,
    assignedCount: 0,
    unassignedCount: 0,
    details: [] as any[]
  };

  for (const booking of unassignedBookings) {
    try {
      const staff = await autoAssignStaff(booking._id.toString());
      if (staff) {
        results.assignedCount++;
        results.details.push({
          bookingId: booking._id,
          status: 'assigned',
          staffName: staff.name
        });
      } else {
        results.unassignedCount++;
        results.details.push({
          bookingId: booking._id,
          status: 'pending_manual_assignment',
          reason: 'No eligible candidate'
        });
      }
    } catch (err: any) {
      results.unassignedCount++;
      results.details.push({
        bookingId: booking._id,
        status: 'error',
        error: err.message || err
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Processed ${results.total} unassigned bookings. Assigned: ${results.assignedCount}, Unassigned: ${results.unassignedCount}`,
    data: results
  });
});

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.model.js';
import { bookingService } from '../services/booking.service.js';
import { calendarService } from '../services/calendar.service.js';
import { createBookingSchema, updateBookingStatusSchema, assignStaffSchema } from '../utils/validators.js';


export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const validated = createBookingSchema.parse(req.body);
  const booking = await bookingService.createBooking(req.user.id, validated);

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

  // Patient name search query
  if (search) {
    const User = (await import('../models/User.model.js')).default;
    const matchedPatients = await User.find({
      name: { $regex: search, $options: 'i' },
      role: 'patient'
    }).select('_id');
    const patientIds = matchedPatients.map((u) => u._id);
    filter.patientId = { $in: patientIds };
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
  const { status } = updateBookingStatusSchema.parse(req.body);

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const validTransitions: Record<string, string[]> = {
    pending_payment: ['scheduled', 'cancelled'],
    scheduled: ['sample_collected', 'cancelled'],
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
    if (booking.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        message: 'Patients can only cancel bookings that are in "scheduled" status',
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

  booking.status = 'cancelled';
  await booking.save();

  // Remove Google Calendar events if any were created
  try {
    await bookingService.removeCalendarEvents(booking);
  } catch (err) {
    console.error('Failed to remove Google Calendar events on cancel:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking },
  });
});

export const assignStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { assignedStaffId } = assignStaffSchema.parse(req.body);

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
          console.error('Failed to delete old staff calendar event:', err);
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
  
  await booking.save();

  // 4. Sync calendar for the new staff member (if booking is scheduled)
  if (booking.status === 'scheduled') {
    await bookingService.syncBookingToCalendar(booking);
  }

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

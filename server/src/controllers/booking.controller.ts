import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.model.js';
import { bookingService } from '../services/booking.service.js';

export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const booking = await bookingService.createBooking(req.user.id, req.body);

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

  const filter: any = {};
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;

  if (dateStr) {
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('patientId', 'name email phone');

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
  const allowedStatuses = [
    'pending_payment',
    'scheduled',
    'sample_collected',
    'in_lab',
    'report_ready',
    'completed',
    'cancelled',
  ];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid booking status' });
    return;
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
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

  booking.homeSampling.assignedStaffId = assignedStaffId
    ? (new Object(assignedStaffId) as any)
    : null;
  await booking.save();

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/createBooking' });
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/getMyBookings' });
});

export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/getBookingById' });
});

export const getAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/getAllBookings' });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/updateBookingStatus' });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/cancelBooking' });
});

export const assignStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: bookings/assignStaff' });
});

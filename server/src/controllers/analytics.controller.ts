import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: analytics/getOverview' });
});

export const getBookingsTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: analytics/getBookingsTrends' });
});

export const getRevenueTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: analytics/getRevenueTrends' });
});

export const getTopTests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: analytics/getTopTests' });
});

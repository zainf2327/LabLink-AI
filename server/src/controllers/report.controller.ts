import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const uploadReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: reports/uploadReport' });
});

export const getMyReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: reports/getMyReports' });
});

export const getReportById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: reports/getReportById' });
});

export const deleteReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: reports/deleteReport' });
});

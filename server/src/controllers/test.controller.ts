import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllTests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: tests/getAllTests' });
});

export const getTestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: tests/getTestById' });
});

export const createTest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: tests/createTest' });
});

export const updateTest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: tests/updateTest' });
});

export const deactivateTest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: tests/deactivateTest' });
});

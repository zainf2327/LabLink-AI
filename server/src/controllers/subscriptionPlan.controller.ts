import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/getAllPlans' });
});

export const createPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/createPlan' });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/updatePlan' });
});

export const deactivatePlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/deactivatePlan' });
});

import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: users/getAllUsers' });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: users/getUserById' });
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: users/updateUser' });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: users/deactivateUser' });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: users/updateProfile' });
});

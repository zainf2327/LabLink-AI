import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: test-categories/getAllCategories' });
});

export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: test-categories/createCategory' });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: test-categories/updateCategory' });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: test-categories/deleteCategory' });
});

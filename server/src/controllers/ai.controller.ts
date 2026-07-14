import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const chatWithAssistant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: ai/chatWithAssistant' });
});

export const getChatHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: ai/getChatHistory' });
});

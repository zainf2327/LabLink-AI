import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyFamilyMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: family-members/getMyFamilyMembers' });
});

export const createFamilyMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: family-members/createFamilyMember' });
});

export const getFamilyMemberById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: family-members/getFamilyMemberById' });
});

export const updateFamilyMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: family-members/updateFamilyMember' });
});

export const deleteFamilyMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Not implemented: family-members/deleteFamilyMember' });
});

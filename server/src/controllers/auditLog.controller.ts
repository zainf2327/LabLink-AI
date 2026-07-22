import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.model.js';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const actorId = req.query.actorId as string | undefined;
  const action = req.query.action as string | undefined;
  const targetModel = req.query.targetModel as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const filter: Record<string, unknown> = {};
  if (actorId) filter.actorId = actorId;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (targetModel) filter.targetModel = targetModel;
  if (startDate || endDate) {
    filter.createdAt = {
      ...(startDate ? { $gte: new Date(startDate) } : {}),
      ...(endDate ? { $lte: new Date(endDate) } : {}),
    };
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate('actorId', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

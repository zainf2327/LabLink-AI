import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema } from '../utils/validators.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAllPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Publicly readable endpoint, list all active plans
  const plans = await SubscriptionPlan.find({ isActive: true });
  res.status(200).json({
    success: true,
    plans,
  });
});

export const createPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const validated = req.body;

  const existing = await SubscriptionPlan.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
  if (existing) {
    res.status(409).json({ success: false, message: 'Plan name already exists' });
    return;
  }

  const plan = await SubscriptionPlan.create(validated);

  await logAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'CREATE_SUB_PLAN',
    targetModel: 'SubscriptionPlan',
    targetId: plan._id.toString(),
    metadata: { name: plan.name, price: plan.price, maxFamilyMembers: plan.maxFamilyMembers },
  });

  res.status(201).json({
    success: true,
    message: 'Subscription plan created successfully',
    plan,
  });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Subscription plan not found' });
    return;
  }

  const validated = req.body;

  if (validated.name && validated.name.toLowerCase() !== plan.name.toLowerCase()) {
    const existing = await SubscriptionPlan.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Plan name already exists' });
      return;
    }
  }

  Object.assign(plan, validated);
  await plan.save();

  await logAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'UPDATE_SUB_PLAN',
    targetModel: 'SubscriptionPlan',
    targetId: plan._id.toString(),
    metadata: validated,
  });

  res.status(200).json({
    success: true,
    message: 'Subscription plan updated successfully',
    plan,
  });
});

export const deactivatePlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Subscription plan not found' });
    return;
  }

  plan.isActive = false;
  await plan.save();

  await logAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'DEACTIVATE_SUB_PLAN',
    targetModel: 'SubscriptionPlan',
    targetId: plan._id.toString(),
  });

  res.status(200).json({
    success: true,
    message: 'Subscription plan deactivated successfully',
  });
});

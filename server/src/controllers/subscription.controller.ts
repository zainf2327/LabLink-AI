import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Subscription from '../models/Subscription.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Payment from '../models/Payment.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Booking from '../models/Booking.model.js';
import WalletTransaction from '../models/WalletTransaction.model.js';
import User from '../models/User.model.js';
import { subscriptionService } from '../services/subscription.service.js';
import { stripeService } from '../services/stripe.service.js';
import { logAudit } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

export const getMySubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || !req.subscription) {
    res.status(200).json({
      success: true,
      subscription: null,
    });
    return;
  }

  const sub = req.subscription;
  const plan = req.subscriptionPlan;

  const remainingSlots = Math.max(0, (plan?.maxFamilyMembers || 0) - sub.activeFamilyMemberIds.length);

  res.status(200).json({
    success: true,
    subscription: {
      ...sub.toObject(),
      remainingSlots,
      needsFamilySelection: sub.needsFamilySelection,
    },
  });
});

export const createSubscriptionIntent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { planId } = req.body;

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) {
    res.status(400).json({ success: false, message: 'Plan not found or inactive' });
    return;
  }

  // Prevent purchasing duplicate active plans
  const existingActive = await Subscription.findOne({
    userId: req.user.id,
    status: 'active',
  });

  if (existingActive && existingActive.planId.toString() === planId) {
    res.status(400).json({ success: false, message: 'You are already subscribed to this plan' });
    return;
  }

  // Fetch patient wallet balance
  const patient = await User.findById(req.user.id);
  if (!patient) {
    res.status(404).json({ success: false, message: 'Patient not found' });
    return;
  }

  const walletCover = Math.min(patient.walletBalance, plan.price);
  const stripeAmount = plan.price - walletCover;

  if (stripeAmount === 0) {
    // Zero-price or fully wallet covered bypass
    const payment = new Payment({
      paymentFor: 'subscription',
      subscriptionPlanId: plan._id,
      patientId: patient._id,
      amount: 0,
      walletAmountUsed: walletCover,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'bypass_zero_amount_' + new Date().getTime(),
      status: 'pending',
    });
    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: null,
        paymentId: payment._id.toString(),
        stripePaymentIntentId: payment.stripePaymentIntentId,
        walletAmountUsed: walletCover,
        stripeAmount: 0,
      },
    });
    return;
  }

  // Create Stripe PaymentIntent
  const amountInCents = Math.round(stripeAmount * 100);
  const intent = await stripeService.createPaymentIntent(
    amountInCents,
    'usd',
    plan._id.toString(),
    `sub_${req.user.id}_${new Date().getTime()}` // idempotency key
  );

  const payment = new Payment({
    paymentFor: 'subscription',
    subscriptionPlanId: plan._id,
    patientId: patient._id,
    amount: stripeAmount,
    walletAmountUsed: walletCover,
    currency: 'usd',
    method: 'stripe',
    stripePaymentIntentId: intent.id,
    status: 'pending',
  });
  await payment.save();

  res.status(200).json({
    success: true,
    data: {
      clientSecret: intent.client_secret,
      paymentId: payment._id.toString(),
      stripePaymentIntentId: payment.stripePaymentIntentId,
      walletAmountUsed: walletCover,
      stripeAmount,
    },
  });
});

export const confirmSubscriptionPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    res.status(400).json({ success: false, message: 'paymentIntentId is required' });
    return;
  }

  const subscription = await subscriptionService.confirmSubscriptionPayment(req.user.id, paymentIntentId);

  res.status(200).json({
    success: true,
    message: 'Subscription activated successfully',
    subscription,
  });
});

export const updateActiveFamilyMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || !req.subscription || !req.subscriptionPlan) {
    res.status(401).json({ success: false, message: 'Unauthorized or subscription unresolved' });
    return;
  }

  const { activeFamilyMemberIds } = req.body;
  if (!activeFamilyMemberIds || !Array.isArray(activeFamilyMemberIds)) {
    res.status(400).json({ success: false, message: 'activeFamilyMemberIds array is required' });
    return;
  }

  const plan = req.subscriptionPlan;

  // Validate length
  if (activeFamilyMemberIds.length > plan.maxFamilyMembers) {
    res.status(400).json({
      success: false,
      message: `Your current plan allows a maximum of ${plan.maxFamilyMembers} active family members.`,
    });
    return;
  }

  // Verify uniqueness
  const uniqueIds = Array.from(new Set(activeFamilyMemberIds));
  if (uniqueIds.length !== activeFamilyMemberIds.length) {
    res.status(400).json({ success: false, message: 'Duplicate family member IDs are not allowed' });
    return;
  }

  // Verify family members belong to user
  const dbFamilyMembers = await FamilyMember.find({ userId: req.user.id });
  const dbFamilyMemberIds = dbFamilyMembers.map((m) => m._id.toString());

  for (const id of activeFamilyMemberIds) {
    if (!dbFamilyMemberIds.includes(id)) {
      res.status(400).json({ success: false, message: `Invalid family member ID: ${id}` });
      return;
    }
  }

  // Upcoming Bookings Check:
  // Identify members who are currently active but are being deactivated (locked)
  const currentActiveIds = req.subscription.activeFamilyMemberIds.map((id: any) => id.toString());
  const deactivatedMemberIds = currentActiveIds.filter((id: string) => !activeFamilyMemberIds.includes(id));

  if (deactivatedMemberIds.length > 0) {
    const hasUpcoming = await Booking.exists({
      forMemberId: { $in: deactivatedMemberIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      status: { $in: ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready'] },
    });

    if (hasUpcoming) {
      res.status(400).json({
        success: false,
        message: 'A family member with upcoming scheduled bookings cannot be deactivated until those bookings are completed or cancelled',
      });
      return;
    }
  }

  // Save the new array
  req.subscription.activeFamilyMemberIds = activeFamilyMemberIds.map((id) => new mongoose.Types.ObjectId(id));
  req.subscription.needsFamilySelection = false;
  await req.subscription.save();

  res.status(200).json({
    success: true,
    message: 'Active family members updated successfully',
    subscription: req.subscription,
  });
});

export const getMySubscriptionHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const history = await Subscription.find({ userId: req.user.id })
    .sort({ startDate: -1 })
    .populate('planId');

  res.status(200).json({
    success: true,
    data: history,
  });
});

export const cancelMySubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || !req.subscription || !req.subscriptionPlan) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const activeSub = req.subscription;
  if (req.subscriptionPlan.isDefault) {
    res.status(400).json({ success: false, message: 'Cannot cancel the Free default plan' });
    return;
  }

  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // 1. Cancel paid subscription
    activeSub.status = 'cancelled';
    await activeSub.save({ session });

    // 2. Find default Free plan
    const defaultPlan = await SubscriptionPlan.findOne({ isDefault: true, isActive: true }).session(session);
    if (!defaultPlan) {
      throw new Error('Default Free subscription plan not found');
    }

    // 3. Create default Free subscription
    const newSub = await subscriptionService.createSubscriptionFromPlan(
      req.user!.id,
      defaultPlan,
      { session, status: 'active' }
    );

    // 4. Initialize family members (locks all family members)
    await subscriptionService.initializeFamilyMembers(newSub, defaultPlan, { session });

    // 5. Log audit
    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'CANCEL_SUBSCRIPTION',
      targetModel: 'Subscription',
      targetId: activeSub._id.toString(),
      metadata: { reason: 'User requested cancellation' },
    });
  });
  await session.endSession();

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully, reverted to Free plan.',
  });
});

export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const total = await Subscription.countDocuments();
  const subscriptions = await Subscription.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email')
    .populate('planId');

  res.status(200).json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

import asyncHandler from '../utils/asyncHandler.js';
import Subscription from '../models/Subscription.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import { logAudit } from '../utils/auditLogger.js';
export const getMySubscription = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const subscription = await Subscription.findOne({
        userId: req.user.id,
        status: 'active',
    }).populate('planId');
    res.status(200).json({
        success: true,
        subscription,
    });
});
export const createSubscription = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const validated = req.body;
    const plan = await SubscriptionPlan.findById(validated.planId);
    if (!plan || !plan.isActive) {
        res.status(400).json({ success: false, message: 'Plan not found or inactive' });
        return;
    }
    // Check if they are already subscribed to this exact plan
    const existingActive = await Subscription.findOne({
        userId: req.user.id,
        status: 'active',
    });
    if (existingActive) {
        if (existingActive.planId.toString() === validated.planId) {
            res.status(400).json({ success: false, message: 'You are already subscribed to this plan' });
            return;
        }
        // Auto-cancel the previous active subscription
        existingActive.status = 'cancelled';
        await existingActive.save();
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'CANCEL_SUBSCRIPTION',
            targetModel: 'Subscription',
            targetId: existingActive._id.toString(),
            metadata: { reason: 'Switched/Upgraded/Downgraded plan' },
        });
    }
    // Direct Activation for v1 (auto-activation)
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30); // 30-day renewal cycle
    const subscription = await Subscription.create({
        userId: req.user.id,
        planId: validated.planId,
        status: 'active',
        startDate: new Date(),
        renewalDate,
    });
    await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'CREATE_SUBSCRIPTION',
        targetModel: 'Subscription',
        targetId: subscription._id.toString(),
        metadata: { planId: validated.planId, planName: plan.name },
    });
    res.status(201).json({
        success: true,
        message: 'Subscribed to plan successfully',
        subscription,
    });
});
export const cancelMySubscription = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const activeSub = await Subscription.findOne({
        userId: req.user.id,
        status: 'active',
    });
    if (!activeSub) {
        res.status(404).json({ success: false, message: 'No active subscription found' });
        return;
    }
    activeSub.status = 'cancelled';
    await activeSub.save();
    await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'CANCEL_SUBSCRIPTION',
        targetModel: 'Subscription',
        targetId: activeSub._id.toString(),
    });
    res.status(200).json({
        success: true,
        message: 'Subscription cancelled immediately',
    });
});
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

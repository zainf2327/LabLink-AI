import mongoose from 'mongoose';
import Subscription from '../models/Subscription.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import { subscriptionService } from '../services/subscription.service.js';
import { logAudit } from '../utils/auditLogger.js';
import logger from '../utils/logger.js';
export const resolveSubscription = async (req, res, next) => {
    if (!req.user || req.user.role !== 'patient') {
        return next();
    }
    try {
        let activeSub = await Subscription.findOne({
            userId: req.user.id,
            status: 'active',
        }).populate('planId');
        if (!activeSub) {
            logger.warn(`User ${req.user.id} has no active subscription. This is an exceptional state.`);
            return next();
        }
        let plan = activeSub.planId;
        // Check expiry for paid plans
        if (plan && !plan.isDefault && activeSub.expiryDate && new Date(activeSub.expiryDate) < new Date()) {
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                // 1. Expire old
                activeSub.status = 'expired';
                await activeSub.save({ session });
                // 2. Find default plan
                const defaultPlan = await SubscriptionPlan.findOne({ isDefault: true, isActive: true }).session(session);
                if (!defaultPlan) {
                    throw new Error('Default Free subscription plan not found');
                }
                // 3. Create Free subscription
                const newSub = await subscriptionService.createSubscriptionFromPlan(req.user.id, defaultPlan, { session, status: 'active' });
                // 4. Initialize family members
                const initializedSub = await subscriptionService.initializeFamilyMembers(newSub, defaultPlan, { session });
                // 5. Audit Log
                await logAudit({
                    actorId: req.user.id,
                    actorRole: req.user.role,
                    action: 'EXPIRE_SUBSCRIPTION',
                    targetModel: 'Subscription',
                    targetId: activeSub._id.toString(),
                    metadata: { reason: 'On-demand expiry check', newSubscriptionId: initializedSub._id.toString() },
                });
                // Update local reference to new active sub and plan
                activeSub = initializedSub;
                plan = defaultPlan;
            });
            await session.endSession();
        }
        req.subscription = activeSub;
        req.subscriptionPlan = plan;
        next();
    }
    catch (err) {
        next(err);
    }
};

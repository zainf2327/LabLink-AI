import mongoose from 'mongoose';
import Subscription from '../models/Subscription.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Payment from '../models/Payment.model.js';
import WalletTransaction from '../models/WalletTransaction.model.js';
import User from '../models/User.model.js';
import { stripeService } from './stripe.service.js';
import { logAudit } from '../utils/auditLogger.js';
import { AppError } from '../utils/AppError.js';
export const subscriptionService = {
    /**
     * Creates a Subscription document based on a SubscriptionPlan.
     * Does NOT handle family members, keeping it clean and reusable.
     */
    async createSubscriptionFromPlan(userId, plan, options) {
        const session = options?.session;
        const status = options?.status || 'active';
        const startDate = new Date();
        let expiryDate = null;
        if (plan.durationMonths !== null && plan.durationMonths !== undefined) {
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);
        }
        const planSnapshot = {
            price: plan.price,
            name: plan.name,
            durationMonths: plan.durationMonths,
            testDiscountPercent: plan.testDiscountPercent,
            freeHomeCollections: plan.freeHomeCollections,
            aiQuestionsPerMonth: plan.aiQuestionsPerMonth,
            maxFamilyMembers: plan.maxFamilyMembers,
        };
        const subData = {
            userId: new mongoose.Types.ObjectId(userId),
            planId: plan._id,
            status,
            startDate,
            expiryDate,
            autoRenew: false,
            activeFamilyMemberIds: [],
            needsFamilySelection: false,
            planSnapshot,
        };
        const [subscription] = await Subscription.create([subData], { session });
        return subscription;
    },
    /**
     * Initializes family members activation logic on an active subscription.
     */
    async initializeFamilyMembers(subscription, plan, options) {
        const session = options?.session;
        const familyMembers = await FamilyMember.find({ userId: subscription.userId }).session(session || null);
        const totalFamilyCount = familyMembers.length;
        if (totalFamilyCount <= plan.maxFamilyMembers) {
            // Auto-select all family members as active
            subscription.activeFamilyMemberIds = familyMembers.map((m) => m._id);
            subscription.needsFamilySelection = false;
        }
        else {
            // Exceeds limit: require explicit user selection, lock everyone initially
            subscription.activeFamilyMemberIds = [];
            subscription.needsFamilySelection = true;
        }
        await subscription.save({ session });
        return subscription;
    },
    /**
     * Confirms a subscription payment intent and activates the subscription.
     * Can be safely called from both controllers and webhooks (idempotent).
     */
    async confirmSubscriptionPayment(userId, paymentIntentId) {
        const payment = await Payment.findOne({
            patientId: userId,
            stripePaymentIntentId: paymentIntentId,
        });
        if (!payment) {
            throw new AppError('Payment record not found', 404);
        }
        // Race condition protection / Idempotency
        if (payment.status === 'succeeded') {
            const existingSub = await Subscription.findById(payment.subscriptionId).populate('planId');
            if (!existingSub) {
                throw new AppError('Subscription not found', 404);
            }
            return existingSub;
        }
        // Validate Stripe payment status (skip for zero-cost bypass)
        if (!payment.stripePaymentIntentId.startsWith('bypass_zero_amount')) {
            const stripeIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
            if (stripeIntent.status !== 'succeeded') {
                throw new AppError('Stripe payment has not succeeded', 400);
            }
        }
        const plan = await SubscriptionPlan.findById(payment.subscriptionPlanId);
        if (!plan) {
            throw new AppError('Subscription plan not found', 400);
        }
        let newSub;
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // 1. Expire existing active subscription
            const existingActive = await Subscription.findOne({
                userId,
                status: 'active',
            }).session(session);
            if (existingActive) {
                existingActive.status = 'expired';
                await existingActive.save({ session });
            }
            // 2. Deduct wallet balance if wallet covers any portion
            if (payment.walletAmountUsed > 0) {
                const patient = await User.findById(userId).session(session);
                if (patient) {
                    patient.walletBalance = Math.max(0, patient.walletBalance - payment.walletAmountUsed);
                    await patient.save({ session });
                    await WalletTransaction.create([{
                            userId: patient._id,
                            type: 'debit',
                            amount: payment.walletAmountUsed,
                            reason: 'subscription_payment',
                            note: `Debited for subscription ${plan.name}`,
                        }], { session });
                }
            }
            // 3. Create new Subscription
            newSub = await subscriptionService.createSubscriptionFromPlan(userId, plan, { session, status: 'active' });
            // 4. Initialize family members
            newSub = await subscriptionService.initializeFamilyMembers(newSub, plan, { session });
            // 5. Update Payment record
            payment.status = 'succeeded';
            payment.subscriptionId = newSub._id;
            payment.paidAt = new Date();
            await payment.save({ session });
            // 6. Log audit trail
            let auditAction = 'PURCHASE_SUBSCRIPTION';
            if (existingActive) {
                const existingPlan = await SubscriptionPlan.findById(existingActive.planId);
                if (existingPlan) {
                    auditAction = plan.price >= existingPlan.price ? 'UPGRADE_SUBSCRIPTION' : 'DOWNGRADE_SUBSCRIPTION';
                }
            }
            await logAudit({
                actorId: userId,
                actorRole: 'patient',
                action: auditAction,
                targetModel: 'Subscription',
                targetId: newSub._id.toString(),
                metadata: { planId: plan._id.toString(), planName: plan.name, paymentId: payment._id.toString() },
            });
        });
        await session.endSession();
        await newSub.populate('planId');
        return newSub;
    }
};

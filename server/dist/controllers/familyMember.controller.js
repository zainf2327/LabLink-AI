import asyncHandler from '../utils/asyncHandler.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Subscription from '../models/Subscription.model.js';
import { createFamilyMemberSchema, updateFamilyMemberSchema } from '../utils/validators.js';
export const getMyFamilyMembers = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const familyMembers = await FamilyMember.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: familyMembers,
    });
});
export const createFamilyMember = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const validated = createFamilyMemberSchema.parse(req.body);
    // Subscription gate check
    const activeSubscription = await Subscription.findOne({
        userId: req.user.id,
        status: 'active',
    }).populate('planId');
    if (!activeSubscription) {
        res.status(403).json({
            success: false,
            message: 'An active subscription is required to add family members.',
        });
        return;
    }
    const plan = activeSubscription.planId;
    const currentCount = await FamilyMember.countDocuments({ userId: req.user.id });
    if (currentCount >= plan.maxFamilyMembers) {
        res.status(403).json({
            success: false,
            message: `Your active subscription allows a maximum of ${plan.maxFamilyMembers} family members.`,
        });
        return;
    }
    const familyMember = await FamilyMember.create({
        userId: req.user.id,
        ...validated,
    });
    res.status(201).json({
        success: true,
        message: 'Family member added successfully',
        familyMember,
    });
});
export const getFamilyMemberById = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const familyMember = await FamilyMember.findById(req.params.id);
    if (!familyMember) {
        res.status(404).json({ success: false, message: 'Family member not found' });
        return;
    }
    if (familyMember.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        return;
    }
    res.status(200).json({
        success: true,
        familyMember,
    });
});
export const updateFamilyMember = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const familyMember = await FamilyMember.findById(req.params.id);
    if (!familyMember) {
        res.status(404).json({ success: false, message: 'Family member not found' });
        return;
    }
    if (familyMember.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        return;
    }
    const validated = updateFamilyMemberSchema.parse(req.body);
    Object.assign(familyMember, validated);
    await familyMember.save();
    res.status(200).json({
        success: true,
        message: 'Family member updated successfully',
        familyMember,
    });
});
export const deleteFamilyMember = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const familyMember = await FamilyMember.findById(req.params.id);
    if (!familyMember) {
        res.status(404).json({ success: false, message: 'Family member not found' });
        return;
    }
    if (familyMember.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        return;
    }
    await FamilyMember.deleteOne({ _id: req.params.id });
    res.status(200).json({
        success: true,
        message: 'Family member removed successfully',
    });
});

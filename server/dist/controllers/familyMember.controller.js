import asyncHandler from '../utils/asyncHandler.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Booking from '../models/Booking.model.js';
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
    if (!req.user || !req.subscription || !req.subscriptionPlan) {
        res.status(401).json({ success: false, message: 'Unauthorized or subscription unresolved' });
        return;
    }
    const validated = req.body;
    const plan = req.subscriptionPlan;
    const currentCount = await FamilyMember.countDocuments({ userId: req.user.id });
    if (currentCount >= plan.maxFamilyMembers) {
        res.status(403).json({
            success: false,
            message: `Your active subscription allows a maximum of ${plan.maxFamilyMembers} family members. Please upgrade your plan.`,
        });
        return;
    }
    const familyMember = await FamilyMember.create({
        userId: req.user.id,
        ...validated,
    });
    // Automatically activate the newly added member since there is a free slot
    req.subscription.activeFamilyMemberIds.push(familyMember._id);
    await req.subscription.save();
    res.status(201).json({
        success: true,
        message: 'Family member added successfully and activated',
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
    if (!req.user || !req.subscription) {
        res.status(401).json({ success: false, message: 'Unauthorized or subscription unresolved' });
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
    // Lock Check: Cannot edit a locked family member
    const activeIds = req.subscription.activeFamilyMemberIds.map((id) => id.toString());
    if (!activeIds.includes(familyMember._id.toString())) {
        res.status(403).json({
            success: false,
            message: 'Forbidden: Cannot edit details of a locked family member.',
        });
        return;
    }
    const validated = req.body;
    Object.assign(familyMember, validated);
    await familyMember.save();
    res.status(200).json({
        success: true,
        message: 'Family member updated successfully',
        familyMember,
    });
});
export const deleteFamilyMember = asyncHandler(async (req, res) => {
    if (!req.user || !req.subscription) {
        res.status(401).json({ success: false, message: 'Unauthorized or subscription unresolved' });
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
    const activeIds = req.subscription.activeFamilyMemberIds.map((id) => id.toString());
    const isLocked = !activeIds.includes(familyMember._id.toString());
    // Lock Check: Cannot delete a locked family member if history exists
    if (isLocked) {
        const hasHistory = await Booking.exists({ forMemberId: familyMember._id });
        if (hasHistory) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Cannot delete a locked family member with existing diagnostic history.',
            });
            return;
        }
    }
    // Cleanup active list if they were active
    if (!isLocked) {
        req.subscription.activeFamilyMemberIds = req.subscription.activeFamilyMemberIds.filter((id) => id.toString() !== familyMember._id.toString());
        await req.subscription.save();
    }
    await FamilyMember.deleteOne({ _id: req.params.id });
    res.status(200).json({
        success: true,
        message: 'Family member removed successfully',
    });
});

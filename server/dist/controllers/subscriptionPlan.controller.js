import asyncHandler from '../utils/asyncHandler.js';
export const getAllPlans = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/getAllPlans' });
});
export const createPlan = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/createPlan' });
});
export const updatePlan = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/updatePlan' });
});
export const deactivatePlan = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscription-plans/deactivatePlan' });
});

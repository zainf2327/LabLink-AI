import asyncHandler from '../utils/asyncHandler.js';
export const getMySubscription = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscriptions/getMySubscription' });
});
export const createSubscription = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscriptions/createSubscription' });
});
export const cancelMySubscription = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscriptions/cancelMySubscription' });
});
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: subscriptions/getAllSubscriptions' });
});

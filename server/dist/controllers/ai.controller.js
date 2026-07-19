import asyncHandler from '../utils/asyncHandler.js';
export const chatWithAssistant = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: ai/chatWithAssistant' });
});
export const getChatHistory = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: ai/getChatHistory' });
});

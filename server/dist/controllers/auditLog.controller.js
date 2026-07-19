import asyncHandler from '../utils/asyncHandler.js';
export const getAuditLogs = asyncHandler(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented: audit-logs/getAuditLogs' });
});

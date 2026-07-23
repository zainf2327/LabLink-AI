import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.model.js';
export const getAuditLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const actorId = req.query.actorId;
    const action = req.query.action;
    const targetModel = req.query.targetModel;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const filter = {};
    if (actorId)
        filter.actorId = actorId;
    if (action)
        filter.action = { $regex: action, $options: 'i' };
    if (targetModel)
        filter.targetModel = targetModel;
    if (startDate || endDate) {
        filter.createdAt = {
            ...(startDate ? { $gte: new Date(startDate) } : {}),
            ...(endDate ? { $lte: new Date(endDate) } : {}),
        };
    }
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    res.status(200).json({
        success: true,
        data: {
            logs,
            pagination: {
                page,
                limit,
                total,
            },
        },
    });
});

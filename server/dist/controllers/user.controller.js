import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';
export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const filter = {};
    if (role)
        filter.role = role;
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .select('-passwordHash')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit);
    res.status(200).json({
        success: true,
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
            },
        },
    });
});
export const getStaffUsers = asyncHandler(async (req, res) => {
    const staff = await User.find({ role: 'staff', isActive: true })
        .select('id name email phone googleCalendarConnected')
        .sort({ name: 1 });
    res.status(200).json({
        success: true,
        data: { staff },
    });
});
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        data: { user },
    });
});
export const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        data: { user },
    });
});
export const deactivateUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' }).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: { user },
    });
});
export const updateProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { returnDocument: 'after' }).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.status(200).json({
        success: true,
        data: { user },
    });
});

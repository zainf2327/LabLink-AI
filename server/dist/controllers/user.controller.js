import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';
import Region from '../models/Region.model.js';
import { logAudit } from '../utils/auditLogger.js';
import { emailService } from '../services/email.service.js';
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
    const updates = {};
    if (req.body.role !== undefined)
        updates.role = req.body.role;
    if (req.body.isActive !== undefined)
        updates.isActive = req.body.isActive;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' }).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'UPDATE_USER',
            targetModel: 'User',
            targetId: user.id,
            metadata: updates,
        });
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
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'DEACTIVATE_USER',
            targetModel: 'User',
            targetId: user.id,
            metadata: { isActive: false },
        });
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
export const updateStaffRegions = asyncHandler(async (req, res) => {
    const { regions } = req.body;
    // 1. Look up the target user
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    // 2. Only active staff members can have assigned regions
    if (user.role !== 'staff') {
        res.status(400).json({
            success: false,
            message: 'Assigned regions can only be set on staff accounts',
        });
        return;
    }
    if (!user.isActive) {
        res.status(400).json({
            success: false,
            message: 'Assigned regions can only be set on active staff accounts',
        });
        return;
    }
    // 3. Validate all provided region IDs in a single query
    if (regions.length > 0) {
        const foundRegions = await Region.find({ _id: { $in: regions }, isActive: true }).select('_id');
        const foundIds = foundRegions.map((r) => r._id.toString());
        const invalidIds = regions.filter((id) => !foundIds.includes(id));
        if (invalidIds.length > 0) {
            res.status(400).json({
                success: false,
                message: `The following region IDs are invalid or inactive: ${invalidIds.join(', ')}`,
            });
            return;
        }
    }
    // 4. Apply update
    const oldRegions = [...user.assignedRegions];
    user.assignedRegions = regions;
    await user.save();
    // 5. Audit log
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'UPDATE_STAFF_REGIONS',
            targetModel: 'User',
            targetId: user.id,
            metadata: { oldRegions, newRegions: regions },
        });
    }
    res.status(200).json({
        success: true,
        data: { user },
    });
});
export const createStaff = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        res.status(409).json({
            success: false,
            message: 'Email already registered',
        });
        return;
    }
    // Generate 12-char secure password
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);
    const newStaff = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'staff',
        isActive: true,
        isVerified: true,
    });
    await emailService.sendStaffWelcomeEmail(newStaff.email, newStaff.name, tempPassword);
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE_STAFF',
            targetModel: 'User',
            targetId: newStaff.id,
            metadata: { email: newStaff.email },
        });
    }
    res.status(201).json({
        success: true,
        data: {
            user: {
                id: newStaff.id,
                name: newStaff.name,
                email: newStaff.email,
                role: newStaff.role,
                isActive: newStaff.isActive,
                isVerified: newStaff.isVerified,
                assignedRegions: newStaff.assignedRegions,
            },
        },
    });
});
export const resetStaffPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    if (user.role !== 'staff') {
        res.status(400).json({
            success: false,
            message: 'Password reset can only be triggered for staff accounts via this endpoint',
        });
        return;
    }
    // Generate 12-char secure password
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);
    user.passwordHash = passwordHash;
    await user.save();
    await emailService.sendStaffPasswordResetEmail(user.email, user.name, tempPassword);
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'RESET_STAFF_PASSWORD',
            targetModel: 'User',
            targetId: user.id,
        });
    }
    res.status(200).json({
        success: true,
        message: 'Staff password reset successfully. An email has been sent with their new credentials.',
    });
});

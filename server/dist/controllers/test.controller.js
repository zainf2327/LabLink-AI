import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Test from '../models/Test.model.js';
import TestCategory from '../models/TestCategory.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { createTestSchema, updateTestSchema } from '../utils/validators.js';
export const getAllTests = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const categoryId = req.query.categoryId;
    const type = req.query.type;
    const search = req.query.search;
    // Build query filter
    const filter = {};
    // Check if admin is requesting to see inactive tests as well
    let showAll = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
            if (decoded.role === 'admin') {
                showAll = true;
            }
        }
        catch (err) {
            // Ignore token verification errors since this endpoint is public
        }
    }
    // If not admin, only show active tests
    if (!showAll) {
        filter.isActive = true;
    }
    if (categoryId) {
        filter.categoryId = categoryId;
    }
    if (type) {
        filter.type = type;
    }
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }
    const total = await Test.countDocuments(filter);
    const tests = await Test.find(filter)
        .populate('categoryId', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);
    res.status(200).json({
        success: true,
        tests,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});
export const getTestById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const test = await Test.findById(id).populate('categoryId', 'name');
    if (!test) {
        res.status(404).json({
            success: false,
            message: 'Test not found',
        });
        return;
    }
    res.status(200).json({
        success: true,
        test,
    });
});
export const createTest = asyncHandler(async (req, res) => {
    const validated = createTestSchema.parse(req.body);
    // Validate Category ID exists
    const categoryExists = await TestCategory.exists({ _id: validated.categoryId });
    if (!categoryExists) {
        res.status(400).json({
            success: false,
            message: 'Invalid categoryId: Category does not exist',
        });
        return;
    }
    // Check if test name already exists
    const existingTest = await Test.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
    if (existingTest) {
        res.status(409).json({
            success: false,
            message: 'Test name already exists',
        });
        return;
    }
    const test = await Test.create(validated);
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE_TEST',
            targetModel: 'Test',
            targetId: test.id,
            metadata: { name: test.name },
        });
    }
    res.status(201).json({
        success: true,
        test,
    });
});
export const updateTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = updateTestSchema.parse(req.body);
    const test = await Test.findById(id);
    if (!test) {
        res.status(404).json({
            success: false,
            message: 'Test not found',
        });
        return;
    }
    // Validate categoryId if provided
    if (validated.categoryId) {
        const categoryExists = await TestCategory.exists({ _id: validated.categoryId });
        if (!categoryExists) {
            res.status(400).json({
                success: false,
                message: 'Invalid categoryId: Category does not exist',
            });
            return;
        }
    }
    // Check duplicate name
    if (validated.name && validated.name.toLowerCase() !== test.name.toLowerCase()) {
        const existingTest = await Test.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
        if (existingTest) {
            res.status(409).json({
                success: false,
                message: 'Test name already exists',
            });
            return;
        }
    }
    const oldName = test.name;
    Object.assign(test, validated);
    await test.save();
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'UPDATE_TEST',
            targetModel: 'Test',
            targetId: test.id,
            metadata: { oldName, newName: test.name },
        });
    }
    res.status(200).json({
        success: true,
        test,
    });
});
export const deactivateTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
        res.status(404).json({
            success: false,
            message: 'Test not found',
        });
        return;
    }
    test.isActive = false;
    await test.save();
    if (req.user) {
        await logAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: 'DEACTIVATE_TEST',
            targetModel: 'Test',
            targetId: test.id,
            metadata: { name: test.name },
        });
    }
    res.status(200).json({
        success: true,
        message: 'Test deactivated successfully',
        test,
    });
});

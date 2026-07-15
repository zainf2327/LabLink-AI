import { Request, Response } from 'express';
import TestCategory from '../models/TestCategory.model.js';
import Test from '../models/Test.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { createCategorySchema, updateCategorySchema } from '../utils/validators.js';

export const getAllCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await TestCategory.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    categories,
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = createCategorySchema.parse(req.body);

  const existingCategory = await TestCategory.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
  if (existingCategory) {
    res.status(409).json({
      success: false,
      message: 'Category name already exists',
    });
    return;
  }

  const category = await TestCategory.create(validated);

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'CREATE_CATEGORY',
      targetModel: 'TestCategory',
      targetId: category.id,
      metadata: { name: category.name },
    });
  }

  res.status(201).json({
    success: true,
    category,
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = updateCategorySchema.parse(req.body);

  const category = await TestCategory.findById(id);
  if (!category) {
    res.status(404).json({
      success: false,
      message: 'Category not found',
    });
    return;
  }

  if (validated.name && validated.name.toLowerCase() !== category.name.toLowerCase()) {
    const existingCategory = await TestCategory.findOne({ name: { $regex: new RegExp(`^${validated.name}$`, 'i') } });
    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Category name already exists',
      });
      return;
    }
  }

  const oldName = category.name;
  Object.assign(category, validated);
  await category.save();

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_CATEGORY',
      targetModel: 'TestCategory',
      targetId: category.id,
      metadata: { oldName, newName: category.name },
    });
  }

  res.status(200).json({
    success: true,
    category,
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const category = await TestCategory.findById(id);
  if (!category) {
    res.status(404).json({
      success: false,
      message: 'Category not found',
    });
    return;
  }

  // Check if any tests (both active and inactive) are linked to this category
  const linkedTestsCount = await Test.countDocuments({ categoryId: id });
  if (linkedTestsCount > 0) {
    res.status(400).json({
      success: false,
      message: 'Cannot delete category: tests are still associated with it',
    });
    return;
  }

  await category.deleteOne();

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'DELETE_CATEGORY',
      targetModel: 'TestCategory',
      targetId: id as string,
      metadata: { name: category.name },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

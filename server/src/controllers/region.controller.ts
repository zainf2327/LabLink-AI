import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Region from '../models/Region.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAllRegions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const search = req.query.search as string;
  const status = req.query.status as string;

  const filter: any = {};

  // Check admin
  let showAll = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; role: string };
      if (decoded.role === 'admin') {
        showAll = true;
      }
    } catch (err) {
      // Ignore token verification errors since this endpoint is public
    }
  }

  if (!showAll) {
    filter.isActive = true;
  } else if (status) {
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { city: searchRegex },
      { country: searchRegex },
    ];
  }

  // If a non-admin calls, or if the client requests 'all=true' (for the dropdown), return all without pagination
  const returnAll = req.query.all === 'true' || !showAll;

  if (returnAll) {
    const regions = await Region.find(filter).sort({ city: 1, name: 1 });
    res.status(200).json({
      success: true,
      regions,
    });
    return;
  }

  const total = await Region.countDocuments(filter);
  const regions = await Region.find(filter)
    .sort({ city: 1, name: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    regions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const createRegion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { city, name, country } = req.body;

  const sanitize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const generatedId = `${sanitize(city)}_${sanitize(name)}`;

  const existingRegion = await Region.findById(generatedId);
  if (existingRegion) {
    res.status(409).json({
      success: false,
      message: 'Region already exists',
    });
    return;
  }

  const region = await Region.create({
    _id: generatedId,
    city: city.trim(),
    name: name.trim(),
    country: country.trim(),
    isActive: true,
  });

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'CREATE_REGION',
      targetModel: 'Region',
      targetId: region._id,
      metadata: { city: region.city, name: region.name, country: region.country },
    });
  }

  res.status(201).json({
    success: true,
    region,
  });
});

export const updateRegion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { city, name, country, isActive } = req.body;

  const region = await Region.findById(id);
  if (!region) {
    res.status(404).json({
      success: false,
      message: 'Region not found',
    });
    return;
  }

  const oldValues = {
    city: region.city,
    name: region.name,
    country: region.country,
    isActive: region.isActive,
  };

  if (city !== undefined) region.city = city.trim();
  if (name !== undefined) region.name = name.trim();
  if (country !== undefined) region.country = country.trim();
  if (isActive !== undefined) region.isActive = isActive;

  await region.save();

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_REGION',
      targetModel: 'Region',
      targetId: region._id,
      metadata: { oldValues, newValues: { city: region.city, name: region.name, country: region.country, isActive: region.isActive } },
    });
  }

  res.status(200).json({
    success: true,
    region,
  });
});

export const deactivateRegion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const region = await Region.findById(id);
  if (!region) {
    res.status(404).json({
      success: false,
      message: 'Region not found',
    });
    return;
  }

  region.isActive = false;
  await region.save();

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'DEACTIVATE_REGION',
      targetModel: 'Region',
      targetId: region._id,
      metadata: { city: region.city, name: region.name },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Region deactivated successfully',
    region,
  });
});

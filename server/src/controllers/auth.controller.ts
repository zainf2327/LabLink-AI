import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../utils/validators.js';

const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = registerSchema.parse(req.body);

  // Check if email already exists
  const existingUser = await User.findOne({ email: validated.email });
  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);

  // Create new user (role is strictly 'patient' by default)
  const newUser = await User.create({
    name: validated.name,
    email: validated.email,
    passwordHash,
    phone: validated.phone,
    role: 'patient',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = loginSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email });
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({
      success: false,
      message: 'User account is deactivated',
    });
    return;
  }

  const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Refresh token missing',
    });
    return;
  }

  let decoded: { id: string };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
    return;
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      message: 'User account is unavailable or deactivated',
    });
    return;
  }

  const accessToken = generateAccessToken(user.id, user.role);

  res.status(200).json({
    success: true,
    accessToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const user = await User.findById(req.user.id).select('-passwordHash');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from '../utils/validators.js';
import { calendarService } from '../services/calendar.service.js';
import { emailService } from '../services/email.service.js';
import crypto from 'crypto';

const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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

  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  // Create new user (role is strictly 'patient' by default)
  const newUser = await User.create({
    name: validated.name,
    email: validated.email,
    passwordHash,
    phone: validated.phone,
    role: 'patient',
    isVerified: false,
    verificationCode,
    verificationCodeExpires,
  });

  // Send verification email
  await emailService.sendVerificationEmail(newUser.email, verificationCode);

  res.status(201).json({
    success: true,
    message: 'Registration successful. A verification code has been sent to your email.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified,
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

  // Block unverified users
  if (!user.isVerified) {
    res.status(401).json({
      success: false,
      message: 'Please verify your email address to log in.',
      isUnverified: true,
    });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
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
      googleCalendarConnected: user.googleCalendarConnected,
      googleEmail: user.googleEmail,
      isVerified: user.isVerified,
      hasPassword: !!user.passwordHash,
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
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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
      googleCalendarConnected: user.googleCalendarConnected,
      googleEmail: user.googleEmail,
      isVerified: user.isVerified,
      hasPassword: !!user.passwordHash,
    },
  });
});

export const initiateGoogleLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authUrl = calendarService.getAuthUrl('login', false);
  res.redirect(authUrl);
});

export const handleGoogleLoginCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  if (!code) {
    res.redirect(`${env.FRONTEND_URL}/login?error=no_code_provided`);
    return;
  }

  try {
    const tokens = await calendarService.getTokensFromCode(code as string);
    const profile = await calendarService.getGoogleProfile(tokens.access_token);
    
    // Check if user already exists
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    
    if (!user) {
      // Register new user as patient
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        googleId: profile.id,
        googleEmail: profile.email,
        role: 'patient',
        isActive: true,
        isVerified: true, // Google accounts are pre-verified
      });
    } else {
      // User exists, update Google fields if not set
      if (!user.googleId) {
        user.googleId = profile.id;
        user.googleEmail = profile.email;
        // If a user registers with password and then logs in with Google, we link them and ensure verified
        user.isVerified = true;
        await user.save();
      }
      if (!user.isActive) {
        res.redirect(`${env.FRONTEND_URL}/login?error=account_deactivated`);
        return;
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshTokenCookie(res, refreshToken);

    // Redirect to frontend home/dashboard
    res.redirect(`${env.FRONTEND_URL}/`);
  } catch (err: any) {
    console.error('Google Auth Callback Error:', err);
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
  }
});

export const initiateGoogleCalendarConnect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // Create a cryptographically signed state token to identify the user safely on callback
  const state = req.user.id + '.' + crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(req.user.id).digest('hex');
  const authUrl = calendarService.getAuthUrl(state, true);
  
  res.json({ success: true, url: authUrl });
});

export const handleGoogleCalendarCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query;
  if (!code || !state) {
    res.redirect(`${env.FRONTEND_URL}/login?error=invalid_calendar_auth`);
    return;
  }

  try {
    // Verify the state token's signature
    const [userId, signature] = (state as string).split('.');
    const expectedSignature = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(userId).digest('hex');
    
    if (signature !== expectedSignature) {
      res.redirect(`${env.FRONTEND_URL}/login?error=state_token_invalid`);
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.redirect(`${env.FRONTEND_URL}/login?error=user_not_found`);
      return;
    }

    const tokens = await calendarService.getTokensFromCode(code as string, true);
    if (!tokens.refresh_token) {
      // If we don't get a refresh token, check if we already have one. If not, throw error.
      if (!user.googleRefreshToken) {
        res.redirect(`${env.FRONTEND_URL}/${user.role}/dashboard?error=missing_refresh_token`);
        return;
      }
    } else {
      const { encrypt } = await import('../utils/crypto.js');
      user.googleRefreshToken = encrypt(tokens.refresh_token);
    }

    const profile = await calendarService.getGoogleProfile(tokens.access_token);
    user.googleEmail = profile.email;
    user.googleCalendarConnected = true;
    await user.save();

    const redirectPath = user.role === 'patient' ? 'patient/dashboard' : `${user.role}/dashboard`;
    res.redirect(`${env.FRONTEND_URL}/${redirectPath}?calendar=connected`);
  } catch (err: any) {
    console.error('Google Calendar Callback Error:', err);
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message || 'calendar_connect_failed')}`);
  }
});

export const disconnectGoogleCalendar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  user.googleCalendarConnected = false;
  user.googleRefreshToken = undefined;
  user.googleEmail = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Google Calendar disconnected successfully',
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = verifyEmailSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email.toLowerCase() });
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({
      success: false,
      message: 'Email is already verified.',
    });
    return;
  }

  if (
    user.verificationCode !== validated.code ||
    !user.verificationCodeExpires ||
    user.verificationCodeExpires < new Date()
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code',
    });
    return;
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
  });
});

export const resendVerificationCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = resendVerificationSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email.toLowerCase() });
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({
      success: false,
      message: 'Email is already verified.',
    });
    return;
  }

  // Generate new 6-digit code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(user.email, verificationCode);

  res.status(200).json({
    success: true,
    message: 'A new verification code has been sent to your email.',
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email.toLowerCase() });
  if (user) {
    // Generate secure reset token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send email
    await emailService.sendPasswordResetEmail(user.email, token);
  }

  // Always return 200/success to prevent user enumeration
  res.status(200).json({
    success: true,
    message: 'If the email address exists, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = resetPasswordSchema.parse(req.body);

  const user = await User.findOne({
    resetPasswordToken: validated.token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
    return;
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);

  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.',
  });
});

export const setPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const validated = setPasswordSchema.parse(req.body);

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);

  user.passwordHash = passwordHash;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password set successfully.',
  });
});

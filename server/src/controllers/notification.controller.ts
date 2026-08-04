import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.model.js';

/**
 * GET /api/v1/notifications
 * Get paginated notifications for the authenticated user, sorted by unread first, then date.
 */
export const getMyNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const total = await Notification.countDocuments({ userId: req.user.id });
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ isRead: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
      },
    },
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404).json({ success: false, message: 'Notification not found' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications of the user as read.
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification.
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const result = await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });

  if (result.deletedCount === 0) {
    res.status(404).json({ success: false, message: 'Notification not found' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

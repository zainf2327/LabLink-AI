import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import Test from '../models/Test.model.js';

// Helper to parse dates from query
const getDatesRange = (req: Request) => {
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  // Defaults to last 30 days if not specified
  const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDateStr ? new Date(endDateStr) : new Date();

  // Set start of day and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { start, end } = getDatesRange(req);

  // Total bookings (excluding unpaid ones)
  const totalBookings = await Booking.countDocuments({
    createdAt: { $gte: start, $lte: end },
    status: { $ne: 'pending_payment' }
  });

  // Total revenue (sum finalAmount of scheduled/collected/in-lab/report-ready/completed bookings)
  const revenueResult = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$finalAmount' }
      }
    }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // New patient registrations in range
  const newPatientsCount = await User.countDocuments({
    role: 'patient',
    createdAt: { $gte: start, $lte: end }
  });

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      totalRevenue,
      newPatientsCount
    }
  });
});

export const getBookingsTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { start, end } = getDatesRange(req);

  const trends = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'pending_payment' }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Format array to friendly labels
  const formattedTrends = trends.map(t => ({
    date: t._id,
    bookings: t.count
  }));

  res.status(200).json({
    success: true,
    data: { trends: formattedTrends }
  });
});

export const getRevenueTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { start, end } = getDatesRange(req);

  const trends = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed'] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$finalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const formattedTrends = trends.map(t => ({
    date: t._id,
    revenue: t.revenue
  }));

  res.status(200).json({
    success: true,
    data: { trends: formattedTrends }
  });
});

export const getTopTests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.query.categoryId as string;
  const matchFilter: any = {
    status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed'] }
  };

  // Optional category filter
  if (categoryId) {
    const matchingTests = await Test.find({ categoryId }).select('_id');
    const testIds = matchingTests.map(t => t._id);
    matchFilter['tests.testId'] = { $in: testIds };
  }

  const topTests = await Booking.aggregate([
    { $match: matchFilter },
    { $unwind: '$tests' },
    // If categoryId filter is active, filter individual unwound tests
    ...(categoryId ? [{
      $match: {
        'tests.testId': { $in: await Test.find({ categoryId }).distinct('_id') }
      }
    }] : []),
    {
      $group: {
        _id: '$tests.testId',
        name: { $first: '$tests.name' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const formattedTopTests = topTests.map(t => ({
    testId: t._id,
    name: t.name,
    bookingsCount: t.count
  }));

  res.status(200).json({
    success: true,
    data: { topTests: formattedTopTests }
  });
});

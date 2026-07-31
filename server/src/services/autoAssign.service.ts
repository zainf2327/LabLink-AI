import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking.model.js';
import User, { IUser } from '../models/User.model.js';
import { calendarService } from './calendar.service.js';
import { bookingService } from './booking.service.js';
import logger from '../utils/logger.js';

function getZonedInstant(year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number, timezone: string): Date {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  
  const getOffsetMs = (date: Date) => {
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const localTime = Date.UTC(getVal('year'), getVal('month') - 1, getVal('day'), getVal('hour'), getVal('minute'), getVal('second'));
    return localTime - date.getTime();
  };

  const offset = getOffsetMs(utcDate);
  return new Date(utcDate.getTime() - offset + ms);
}

export function getDayBoundsInTimezone(date: Date, timezone: string): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const getVal = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  const year = getVal('year');
  const month = getVal('month');
  const day = getVal('day');

  return {
    start: getZonedInstant(year, month, day, 0, 0, 0, 0, timezone),
    end: getZonedInstant(year, month, day, 23, 59, 59, 999, timezone),
  };
}

/**
 * Get typical travel buffer time between region zones.
 * - 20 minutes if the same region.
 * - 45 minutes if different regions.
 */
export function getRegionTravelBuffer(regionA: string, regionB: string): number {
  if (regionA === regionB) {
    return 20 * 60 * 1000; // 20 minutes in ms
  }
  return 45 * 60 * 1000; // 45 minutes in ms
}

/**
 * Check if the booking time slot falls within the staff member's working shifts.
 * A booking slot starts at scheduledAt and takes 30 minutes.
 */
export function checkShiftAvailability(staff: IUser, scheduledAt: Date): boolean {
  if (!staff.shifts || staff.shifts.length === 0) {
    return false;
  }

  // Resolve target timezone from the shifts list, fallback to Asia/Karachi
  const timezone = staff.shifts[0]?.timezone || 'Asia/Karachi';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(scheduledAt);
  const getVal = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  const year = getVal('year');
  const month = getVal('month');
  const day = getVal('day');
  const hour = getVal('hour');
  const minute = getVal('minute');
  const second = getVal('second');

  // Build a UTC wall-clock date representation to extract timezone-independent values
  const wallClockDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const dayOfWeek = wallClockDate.getUTCDay();

  const shift = staff.shifts.find((s) => s.dayOfWeek === dayOfWeek);
  if (!shift) {
    return false;
  }

  // Convert shift times (HH:MM) to minutes-since-midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
  const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

  const bookingStartMinutes = wallClockDate.getUTCHours() * 60 + wallClockDate.getUTCMinutes();
  const bookingEndMinutes = bookingStartMinutes + 30; // 30 mins collection duration

  return bookingStartMinutes >= shiftStartMinutes && bookingEndMinutes <= shiftEndMinutes;
}

/**
 * Check if the staff member has travel conflict based on other bookings on the same day.
 */
export async function checkDynamicTravelConflict(
  staffId: string | mongoose.Types.ObjectId,
  scheduledAt: Date,
  bookingRegion: string,
  currentBookingId: string | mongoose.Types.ObjectId,
  timezone: string,
  session?: mongoose.ClientSession
): Promise<boolean> {
  const { start: startOfDay, end: endOfDay } = getDayBoundsInTimezone(scheduledAt, timezone);

  // Find other active bookings for the staff member on the same day
  const query = {
    'homeSampling.assignedStaffId': staffId,
    'homeSampling.scheduledAt': { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] as const },
    _id: { $ne: currentBookingId },
  };

  const existingBookings = session
    ? await Booking.find(query).session(session).sort({ 'homeSampling.scheduledAt': 1 })
    : await Booking.find(query).sort({ 'homeSampling.scheduledAt': 1 });

  const bookingStart = scheduledAt.getTime();
  const bookingEnd = bookingStart + 30 * 60 * 1000; // 30 minutes duration

  for (const other of existingBookings) {
    if (!other.homeSampling.scheduledAt || !other.homeSampling.region) {
      continue;
    }

    const otherStart = other.homeSampling.scheduledAt.getTime();
    const otherEnd = otherStart + 30 * 60 * 1000;

    // Check if other booking is before the new one
    if (otherStart <= bookingStart) {
      const travelBuffer = getRegionTravelBuffer(other.homeSampling.region, bookingRegion);
      const earliestStart = otherEnd + travelBuffer;
      if (bookingStart < earliestStart) {
        return true; // Conflict!
      }
    }

    // Check if other booking is after the new one
    if (otherStart >= bookingStart) {
      const travelBuffer = getRegionTravelBuffer(bookingRegion, other.homeSampling.region);
      const earliestStartAfter = bookingEnd + travelBuffer;
      if (otherStart < earliestStartAfter) {
        return true; // Conflict!
      }
    }
  }

  return false;
}

/**
 * Main Auto-Assignment algorithm for home sampling bookings.
 * Wraps DB operations inside a MongoDB transaction session.
 */
export async function autoAssignStaff(bookingId: string): Promise<IUser | null> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        await session.commitTransaction();
        session.endSession();
        return null;
      }

      if (!booking.homeSampling.requested || !booking.homeSampling.region || !booking.homeSampling.scheduledAt) {
        await session.commitTransaction();
        session.endSession();
        return null;
      }

      // Short-circuit if a staff member is already assigned or auto-assignment failed (concurrency check)
      if (booking.homeSampling.assignedStaffId || booking.status === 'pending_manual_assignment') {
        await session.commitTransaction();
        session.endSession();
        return booking.homeSampling.assignedStaffId ? await User.findById(booking.homeSampling.assignedStaffId) : null;
      }

      // Query active staff users who cover the booking's region
      const staffMembers = await User.find({
        role: 'staff',
        isActive: true,
        assignedRegions: booking.homeSampling.region,
      }).session(session);

      logger.debug(`[AutoAssign Debug] Booking ID: ${bookingId}`);
      logger.debug(`[AutoAssign Debug] Booking Region: ${booking.homeSampling.region}`);
      logger.debug(`[AutoAssign Debug] Booking Scheduled At: ${booking.homeSampling.scheduledAt}`);
      logger.debug(`[AutoAssign Debug] Found ${staffMembers.length} active staff members covering this region.`);

      const candidates: Array<{ staff: IUser; workload: number }> = [];

      for (const staff of staffMembers) {
        const timezone = staff.shifts[0]?.timezone || 'Asia/Karachi';
        // 1. Shift check
        const shiftOk = checkShiftAvailability(staff, booking.homeSampling.scheduledAt);
        logger.debug(`[AutoAssign Debug] Staff: ${staff.name} (${staff.email}) | Shift check: ${shiftOk}`);
        if (!shiftOk) {
          continue;
        }

        // 2. Standard overlap check (+/- 1 hour)
        const startTime = new Date(booking.homeSampling.scheduledAt.getTime() - 60 * 60 * 1000);
        const endTime = new Date(booking.homeSampling.scheduledAt.getTime() + 60 * 60 * 1000);
        const overlap = await Booking.findOne({
          'homeSampling.assignedStaffId': staff._id,
          status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] as const },
          'homeSampling.scheduledAt': { $gte: startTime, $lte: endTime },
          _id: { $ne: booking._id },
        }).session(session);

        logger.debug(`[AutoAssign Debug] Staff: ${staff.name} | Overlap check: ${overlap ? 'CONFLICT' : 'OK'}`);
        if (overlap) {
          continue;
        }

        // 3. Dynamic travel buffer check
        const travelConflict = await checkDynamicTravelConflict(
          staff._id,
          booking.homeSampling.scheduledAt,
          booking.homeSampling.region,
          booking._id,
          timezone,
          session
        );
        logger.debug(`[AutoAssign Debug] Staff: ${staff.name} | Travel conflict check: ${travelConflict ? 'CONFLICT' : 'OK'}`);
        if (travelConflict) {
          continue;
        }

        // 4. Google Calendar check (using checkFreeBusy)
        let calendarBusy = false;
        if (staff.googleCalendarConnected && staff.googleRefreshToken) {
          try {
            const { decrypt } = await import('../utils/crypto.js');
            const decryptedToken = decrypt(staff.googleRefreshToken);
            calendarBusy = await calendarService.checkFreeBusy(
              decryptedToken,
              staff.googleEmail || staff.email,
              startTime,
              endTime
            );
          } catch (err) {
            logger.error(`[AutoAssign] Failed to check Google Calendar for staff ${staff._id}:`, err);
          }
        }
        logger.debug(`[AutoAssign Debug] Staff: ${staff.name} | Google Calendar busy check: ${calendarBusy ? 'BUSY' : 'FREE'}`);
        if (calendarBusy) {
          continue;
        }

        // 5. Calculate workload today
        const { start: startOfDay, end: endOfDay } = getDayBoundsInTimezone(booking.homeSampling.scheduledAt, timezone);

        const workload = await Booking.countDocuments({
          'homeSampling.assignedStaffId': staff._id,
          'homeSampling.scheduledAt': { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] as const },
          _id: { $ne: booking._id },
        }).session(session);

        candidates.push({ staff, workload });
      }

      if (candidates.length === 0) {
        // Fallback: Transition to pending_manual_assignment
        booking.status = 'pending_manual_assignment';
        booking.homeSampling.assignedStaffId = null;
        await booking.save({ session });
        await session.commitTransaction();
        session.endSession();

        logger.warn(`[AutoAssign] No eligible staff found for booking ${bookingId}. Set status to pending_manual_assignment.`);
        return null;
      }

      // Sort by workload (fairness: lowest workload first)
      candidates.sort((a, b) => a.workload - b.workload);
      const selected = candidates[0].staff;

      // Lock selected staff member by updating a dummy field to force a write lock on the document
      await User.findOneAndUpdate(
        { _id: selected._id },
        { $set: { updatedAt: new Date() } }
      ).session(session);

      // Re-verify conflicts under the write lock to prevent write skew
      const startTime = new Date(booking.homeSampling.scheduledAt.getTime() - 60 * 60 * 1000);
      const endTime = new Date(booking.homeSampling.scheduledAt.getTime() + 60 * 60 * 1000);
      const overlapRecheck = await Booking.findOne({
        'homeSampling.assignedStaffId': selected._id,
        status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] as const },
        'homeSampling.scheduledAt': { $gte: startTime, $lte: endTime },
        _id: { $ne: booking._id },
      }).session(session);

      if (overlapRecheck) {
        throw new Error('TransientTransactionError: write skew detected');
      }

      // Assign selected staff member
      booking.homeSampling.assignedStaffId = selected._id;
      booking.status = 'scheduled';
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Async trigger Google Calendar Sync (fire-and-forget)
      bookingService.syncBookingToCalendar(booking).catch((err) => {
        logger.error(`[AutoAssign] Async Google Calendar sync failed for booking ${bookingId}:`, err);
      });

      return selected;
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();

      const isTransient =
        error.message?.toLowerCase().includes('transienttransactionerror') ||
        error.errorLabels?.includes('TransientTransactionError') ||
        error.message?.toLowerCase().includes('write conflict') ||
        error.message?.toLowerCase().includes('write skew');

      if (isTransient && attempts < maxAttempts) {
        logger.warn(`[AutoAssign] Concurrency conflict detected. Retrying attempt ${attempts + 1}/${maxAttempts}...`);
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
        continue;
      }

      throw error;
    }
  }

  return null;
}

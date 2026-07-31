import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import Region from '../models/Region.model.js';
import Test from '../models/Test.model.js';
import TestCategory from '../models/TestCategory.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import { autoAssignStaff, checkShiftAvailability, getDayBoundsInTimezone } from '../services/autoAssign.service.js';

async function waitForAssignment(bookingId: string): Promise<any> {
  for (let i = 0; i < 20; i++) {
    const booking = await Booking.findById(bookingId);
    if (booking && (booking.homeSampling.assignedStaffId || booking.status === 'pending_manual_assignment')) {
      return booking;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return await Booking.findById(bookingId);
}

describe('Auto-Assign Staff Integration Tests', () => {
  let adminToken: string;
  let patientToken: string;
  let staffA: any;
  let staffB: any;
  let staffC: any;
  let patient: any;
  let admin: any;
  let testDoc: any;
  let mondayDate: Date;

  const defaultShifts = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
  ];

  beforeAll(async () => {
    // 1. Create Regions
    await Region.findByIdAndUpdate('test_auto_region_johar', { city: 'Lahore', name: 'Johar Town', country: 'Pakistan', isActive: true }, { upsert: true });
    await Region.findByIdAndUpdate('test_auto_region_gulberg', { city: 'Lahore', name: 'Gulberg', country: 'Pakistan', isActive: true }, { upsert: true });
    await Region.findByIdAndUpdate('test_auto_region_dha', { city: 'Lahore', name: 'DHA Lahore', country: 'Pakistan', isActive: true }, { upsert: true });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 2. Create Staff members
    staffA = await User.create({
      name: 'Staff A Johar',
      email: 'test_auto_staffA@test.com',
      passwordHash,
      phone: '+923000000001',
      role: 'staff',
      isVerified: true,
      isActive: true,
      assignedRegions: ['test_auto_region_johar', 'test_auto_region_gulberg'],
      shifts: defaultShifts,
    });

    staffB = await User.create({
      name: 'Staff B Johar Only',
      email: 'test_auto_staffB@test.com',
      passwordHash,
      phone: '+923000000002',
      role: 'staff',
      isVerified: true,
      isActive: true,
      assignedRegions: ['test_auto_region_johar'],
      shifts: defaultShifts,
    });

    staffC = await User.create({
      name: 'Staff C Gulberg',
      email: 'test_auto_staffC@test.com',
      passwordHash,
      phone: '+923000000003',
      role: 'staff',
      isVerified: true,
      isActive: true,
      assignedRegions: ['test_auto_region_gulberg'],
      shifts: defaultShifts,
    });

    // 3. Create Admin & Patient
    admin = await User.create({
      name: 'Test Admin',
      email: 'test_auto_admin@test.com',
      passwordHash,
      phone: '+923000000000',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    patient = await User.create({
      name: 'Test Patient',
      email: 'test_auto_patient@test.com',
      passwordHash,
      phone: '+923000000004',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    // Login
    const patientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test_auto_patient@test.com', password: 'password123' });
    patientToken = patientLogin.body.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test_auto_admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Get or Create Subscription Plan & Subscription
    let freePlan = await SubscriptionPlan.findOne({ name: 'Free' });
    if (!freePlan) {
      freePlan = await SubscriptionPlan.create({
        name: 'Free',
        price: 0,
        maxFamilyMembers: 0,
        features: ['Single user dashboard'],
        isActive: true,
        durationMonths: null,
        isDefault: true,
        testDiscountPercent: 0,
        freeHomeCollections: false,
        aiQuestionsPerMonth: 5,
      });
    }

    let activeSub = await Subscription.findOne({ userId: patient._id, status: 'active' });
    if (!activeSub) {
      await Subscription.create({
        userId: patient._id,
        planId: freePlan._id,
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        planSnapshot: {
          name: freePlan.name,
          price: freePlan.price,
          durationMonths: null,
          testDiscountPercent: 0,
          freeHomeCollections: false,
          aiQuestionsPerMonth: 5,
          maxFamilyMembers: 0,
        },
      });
    }

    // Create a test
    const category = await TestCategory.create({ name: 'Test Category Auto' });
    testDoc = await Test.create({
      name: 'Test Auto',
      description: 'Auto assign integration test',
      type: 'lab',
      categoryId: category._id,
      price: 0,
      isHomeCollectionAvailable: true,
      isActive: true,
      duration: '24 hours',
    });

    mondayDate = new Date();
    mondayDate.setDate(mondayDate.getDate() + ((1 + 7 - mondayDate.getDay()) % 7 || 7)); // Next Monday
    mondayDate.setHours(10, 0, 0, 0); // 10:00 AM
  });

  it('Test 1: should balance workload and assign to staff with lowest workload', async () => {
    // Manually pre-assign a booking to Staff B so Staff B has workload = 1
    await Booking.create({
      patientId: patient._id,
      tests: [{ testId: testDoc._id, name: testDoc.name, price: testDoc.price }],
      status: 'scheduled',
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House B, Street B, Lahore',
        scheduledAt: new Date(mondayDate.getTime() - 2 * 60 * 60 * 1000), // Monday at 8:00 AM
        region: 'test_auto_region_johar',
        assignedStaffId: staffB._id,
      },
      notes: 'Test Auto - Preassigned to B',
    });

    // Create booking via API at 10:00 AM in Johar Town
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        tests: [testDoc._id.toString()],
        homeSampling: {
          requested: true,
          region: 'test_auto_region_johar',
          streetAddress: 'House 1',
          blockNumber: 'Block X',
          landmark: 'Main Gate',
          city: 'Lahore',
          country: 'Pakistan',
          scheduledAt: mondayDate.toISOString(),
        },
        notes: 'Test Auto - Booking 1',
      });

    expect(bookingRes.status).toBe(201);
    const updatedBooking = await waitForAssignment(bookingRes.body.data.booking._id);
    expect(updatedBooking.homeSampling.assignedStaffId.toString()).toBe(staffA._id.toString());
  });

  it('Test 2: should respect region travel buffer and reject staff with conflicts', async () => {
    // Staff A is busy at 10:00 AM in Johar Town (Booking 1).
    // Booking 2 is scheduled at 10:30 AM in Gulberg (different region).
    // Gulberg requires 45 mins travel from Johar Town. Staff A cannot make it.
    // Staff C covers Gulberg and is free, so Staff C should be assigned.
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        tests: [testDoc._id.toString()],
        homeSampling: {
          requested: true,
          region: 'test_auto_region_gulberg',
          streetAddress: 'House 2',
          city: 'Lahore',
          country: 'Pakistan',
          scheduledAt: new Date(mondayDate.getTime() + 30 * 60 * 1000).toISOString(), // 10:30 AM
        },
        notes: 'Test Auto - Booking 2',
      });

    expect(bookingRes.status).toBe(201);
    const updatedBooking = await waitForAssignment(bookingRes.body.data.booking._id);
    expect(updatedBooking.homeSampling.assignedStaffId.toString()).toBe(staffC._id.toString());
  });

  it('Test 3: should fallback to pending_manual_assignment if no staff covers the region', async () => {
    // DHA Lahore is not covered by any active staff initially
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        tests: [testDoc._id.toString()],
        homeSampling: {
          requested: true,
          region: 'test_auto_region_dha',
          streetAddress: 'House 3',
          city: 'Lahore',
          country: 'Pakistan',
          scheduledAt: mondayDate.toISOString(),
        },
        notes: 'Test Auto - Booking 3',
      });

    expect(bookingRes.status).toBe(201);
    const updatedBooking = await waitForAssignment(bookingRes.body.data.booking._id);
    expect(updatedBooking.status).toBe('pending_manual_assignment');
    expect(updatedBooking.homeSampling.assignedStaffId).toBeNull();
  });

  it('Test 4: should handle concurrency and prevent double-booking single staff member', async () => {
    // Let Staff A also cover DHA Lahore
    await User.findByIdAndUpdate(staffA._id, { $push: { assignedRegions: 'test_auto_region_dha' } });

    const timeSlot = new Date(mondayDate);
    timeSlot.setHours(14, 0, 0, 0); // 2:00 PM

    const cBooking1 = await Booking.create({
      patientId: patient._id,
      tests: [{ testId: testDoc._id, name: testDoc.name, price: testDoc.price }],
      status: 'scheduled',
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House C1, DHA Lahore',
        scheduledAt: timeSlot,
        region: 'test_auto_region_dha',
        assignedStaffId: null,
      },
      notes: 'Test Auto - Concurrent 1',
    });

    const cBooking2 = await Booking.create({
      patientId: patient._id,
      tests: [{ testId: testDoc._id, name: testDoc.name, price: testDoc.price }],
      status: 'scheduled',
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House C2, DHA Lahore',
        scheduledAt: timeSlot,
        region: 'test_auto_region_dha',
        assignedStaffId: null,
      },
      notes: 'Test Auto - Concurrent 2',
    });

    // Run autoAssignStaff concurrently
    await Promise.allSettled([
      autoAssignStaff(cBooking1._id.toString()),
      autoAssignStaff(cBooking2._id.toString()),
    ]);

    const finalC1 = await Booking.findById(cBooking1._id);
    const finalC2 = await Booking.findById(cBooking2._id);

    const isC1Assigned = finalC1?.homeSampling.assignedStaffId?.toString() === staffA._id.toString();
    const isC2Assigned = finalC2?.homeSampling.assignedStaffId?.toString() === staffA._id.toString();

    // Verify Staff A was NOT double-booked
    expect(isC1Assigned && isC2Assigned).toBe(false);
  });

  it('Test 5: should allow manual assignment by admin and cancellation by patient', async () => {
    const manualBooking = await Booking.create({
      patientId: patient._id,
      tests: [{ testId: testDoc._id, name: testDoc.name, price: 100 }],
      status: 'pending_manual_assignment',
      totalAmount: 100,
      discountAmount: 0,
      finalAmount: 100,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House 5, Johar Town',
        scheduledAt: new Date(mondayDate.getTime() + 6 * 60 * 60 * 1000),
        region: 'test_auto_region_johar',
        assignedStaffId: null,
      },
      notes: 'Test Auto - Booking 5',
    });

    // Admin manually assigns staff
    const assignRes = await request(app)
      .patch(`/api/v1/bookings/${manualBooking._id}/assign-staff`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedStaffId: staffA._id.toString(),
      });

    expect(assignRes.status).toBe(200);

    const postAssignBooking = await Booking.findById(manualBooking._id);
    expect(postAssignBooking!.status).toBe('scheduled');
    expect(postAssignBooking!.homeSampling.assignedStaffId!.toString()).toBe(staffA._id.toString());

    // Patient cancels scheduled booking
    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${manualBooking._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(cancelRes.status).toBe(200);

    const postCancelBooking = await Booking.findById(manualBooking._id);
    expect(postCancelBooking!.status).toBe('cancelled');
  });

  it('Test 7: should evaluate getDayBoundsInTimezone correctly regardless of process.env.TZ', () => {
    // Time 1: August 3rd, 2026 at 00:30 PKT (which is August 2nd, 19:30 UTC)
    const earlyTime = new Date(Date.UTC(2026, 7, 2, 19, 30, 0));
    
    // Time 2: August 3rd, 2026 at 23:45 PKT (which is August 3rd, 18:45 UTC)
    const lateTime = new Date(Date.UTC(2026, 7, 3, 18, 45, 0));

    // Save original TZ
    const originalTZ = process.env.TZ;

    try {
      for (const targetTZ of ['UTC', 'America/New_York', 'Europe/London']) {
        process.env.TZ = targetTZ;

        const boundsEarly = getDayBoundsInTimezone(earlyTime, 'Asia/Karachi');
        const boundsLate = getDayBoundsInTimezone(lateTime, 'Asia/Karachi');

        // Expected bounds (local day August 3rd):
        // Start: 2026-08-03 00:00:00.000 PKT => 2026-08-02 19:00:00.000 UTC
        // End: 2026-08-03 23:59:59.999 PKT => 2026-08-03 18:59:59.999 UTC
        
        expect(boundsEarly.start.toISOString()).toBe('2026-08-02T19:00:00.000Z');
        expect(boundsEarly.end.toISOString()).toBe('2026-08-03T18:59:59.999Z');

        expect(boundsLate.start.toISOString()).toBe('2026-08-02T19:00:00.000Z');
        expect(boundsLate.end.toISOString()).toBe('2026-08-03T18:59:59.999Z');
      }
    } finally {
      // Restore original TZ
      if (originalTZ) {
        process.env.TZ = originalTZ;
      } else {
        delete process.env.TZ;
      }
    }
  });

  it('Test 6: should evaluate checkShiftAvailability correctly regardless of process.env.TZ', () => {
    // Staff member with shift in Asia/Karachi timezone
    // Monday shift: 09:00 to 17:00 (9 AM to 5 PM PKT)
    const mockStaff: any = {
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', timezone: 'Asia/Karachi' }
      ]
    };

    // Monday booking at 4:00 PM PKT (which is 11:00 AM UTC)
    // Date.UTC(2026, 7, 3, 11, 0, 0) => Monday, August 3rd, 2026 at 11:00 UTC
    const bookingDate = new Date(Date.UTC(2026, 7, 3, 11, 0, 0));

    // Save original TZ
    const originalTZ = process.env.TZ;

    try {
      // Mock server to UTC
      process.env.TZ = 'UTC';
      const resUTC = checkShiftAvailability(mockStaff, bookingDate);

      // Mock server to Los Angeles (PDT/PST)
      process.env.TZ = 'America/Los_Angeles';
      const resLA = checkShiftAvailability(mockStaff, bookingDate);

      // Both should return true because 11:00 AM UTC is 4:00 PM PKT, which is within the 09:00-17:00 PKT shift
      expect(resUTC).toBe(true);
      expect(resLA).toBe(true);

      // Test outside shift: Monday at 9:00 PM PKT (which is 4:00 PM UTC / 16:00 UTC)
      const lateBooking = new Date(Date.UTC(2026, 7, 3, 16, 0, 0));

      process.env.TZ = 'UTC';
      const lateUTC = checkShiftAvailability(mockStaff, lateBooking);

      process.env.TZ = 'America/Los_Angeles';
      const lateLA = checkShiftAvailability(mockStaff, lateBooking);

      expect(lateUTC).toBe(false);
      expect(lateLA).toBe(false);
    } finally {
      // Restore original TZ
      if (originalTZ) {
        process.env.TZ = originalTZ;
      } else {
        delete process.env.TZ;
      }
    }
  });
});

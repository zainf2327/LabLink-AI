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
import { autoAssignStaff } from '../services/autoAssign.service.js';

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
});

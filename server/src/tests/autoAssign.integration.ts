import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import Region from '../models/Region.model.js';
import Test from '../models/Test.model.js';
import TestCategory from '../models/TestCategory.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import { env } from '../config/env.js';
import { autoAssignStaff } from '../services/autoAssign.service.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = env.MONGODB_URI;
const API_URL = `http://127.0.0.1:${env.PORT}/api/v1`;

async function waitForAssignment(bookingId: string): Promise<any> {
  for (let i = 0; i < 20; i++) {
    const booking = await Booking.findById(bookingId);
    if (booking && (booking.homeSampling.assignedStaffId || booking.status === 'pending_manual_assignment')) {
      return booking;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return await Booking.findById(bookingId);
}

async function runTests() {
  console.log('--- STARTING AUTO-ASSIGN STAFF INTEGRATION TESTS ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Database.');

  // Clean up existing test data
  console.log('Cleaning up previous test data...');
  await User.deleteMany({ email: /test_auto_/ });
  await TestCategory.deleteMany({ name: /Test Category Auto/ });
  await Test.deleteMany({ name: /Test Auto/ });
  await Booking.deleteMany({ notes: /Test Auto/ });

  // 1. Create Regions if they don't exist
  await Region.findByIdAndUpdate('lahore_johar_town', { city: 'Lahore', name: 'Johar Town', country: 'Pakistan' }, { upsert: true });
  await Region.findByIdAndUpdate('lahore_gulberg', { city: 'Lahore', name: 'Gulberg', country: 'Pakistan' }, { upsert: true });
  await Region.findByIdAndUpdate('lahore_dha_lahore', { city: 'Lahore', name: 'DHA Lahore', country: 'Pakistan' }, { upsert: true });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 2. Create Staff members
  const defaultShifts = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
  ];

  console.log('Creating staff members...');
  // Staff A: Johar Town & Gulberg (low workload initially)
  const staffA = await User.create({
    name: 'Staff A Johar',
    email: 'test_auto_staffA@test.com',
    passwordHash,
    phone: '+923000000001',
    role: 'staff',
    isVerified: true,
    isActive: true,
    assignedRegions: ['lahore_johar_town', 'lahore_gulberg'],
    shifts: defaultShifts,
  });

  // Staff B: Johar Town only (starts with daily workload = 1)
  const staffB = await User.create({
    name: 'Staff B Johar Only',
    email: 'test_auto_staffB@test.com',
    passwordHash,
    phone: '+923000000002',
    role: 'staff',
    isVerified: true,
    isActive: true,
    assignedRegions: ['lahore_johar_town'],
    shifts: defaultShifts,
  });

  // Staff C: Gulberg only
  const staffC = await User.create({
    name: 'Staff C Gulberg',
    email: 'test_auto_staffC@test.com',
    passwordHash,
    phone: '+923000000003',
    role: 'staff',
    isVerified: true,
    isActive: true,
    assignedRegions: ['lahore_gulberg'],
    shifts: defaultShifts,
  });

  // 3. Create Admin & Patient
  console.log('Creating admin & patient...');
  const admin = await User.create({
    name: 'Test Admin',
    email: 'test_auto_admin@test.com',
    passwordHash,
    phone: '+923000000000',
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  const patient = await User.create({
    name: 'Test Patient',
    email: 'test_auto_patient@test.com',
    passwordHash,
    phone: '+923000000004',
    role: 'patient',
    isVerified: true,
    isActive: true,
  });

  // Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_auto_patient@test.com', password: 'password123' }),
  });
  const loginData = await loginRes.json() as any;
  if (!loginData.success) throw new Error('Patient login failed: ' + loginData.message);
  const patientToken = loginData.accessToken;

  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_auto_admin@test.com', password: 'password123' }),
  });
  const adminLoginData = await adminLoginRes.json() as any;
  if (!adminLoginData.success) throw new Error('Admin login failed: ' + adminLoginData.message);
  const adminToken = adminLoginData.accessToken;

  // Create active subscription for patient if they do not have one (required for booking)
  let sub = await Subscription.findOne({ userId: patient._id, status: 'active' });
  if (!sub) {
    const freePlan = await SubscriptionPlan.findOne({ price: 0 });
    if (freePlan) {
      await Subscription.create({
        userId: patient._id,
        planId: freePlan._id,
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        planSnapshot: {
          name: freePlan.name,
          price: freePlan.price,
          durationMonths: freePlan.durationMonths ?? null,
          testDiscountPercent: freePlan.testDiscountPercent ?? 0,
          freeHomeCollections: freePlan.freeHomeCollections ?? false,
          aiQuestionsPerMonth: freePlan.aiQuestionsPerMonth ?? 0,
          maxFamilyMembers: freePlan.maxFamilyMembers,
        },
      });
    }
  }

  // Create a test
  const category = await TestCategory.create({ name: 'Test Category Auto' });
  const test = await Test.create({
    name: 'Test Auto',
    description: 'Auto assign integration test',
    type: 'lab',
    categoryId: category._id,
    price: 0, // 0 price bypasses Stripe payments instantly!
    isHomeCollectionAvailable: true,
    isActive: true,
    duration: '24 hours',
  });

  // --- TEST 1: WORKLOAD BALANCING ---
  // Create booking 1 for Monday (dayOfWeek: 1) at 10:00 AM in Johar Town
  // Both Staff A and Staff B cover Johar Town. Initially, both have 0 workload.
  // We'll manually give Staff B one booking on Monday to check if Staff A gets assigned.
  console.log('\n--- Running Test 1: Workload Balancing ---');
  
  const mondayDate = new Date();
  mondayDate.setDate(mondayDate.getDate() + ((1 + 7 - mondayDate.getDay()) % 7 || 7)); // Next Monday
  mondayDate.setHours(10, 0, 0, 0); // 10:00 AM

  // Manually pre-assign a booking to Staff B
  const preBooking = await Booking.create({
    patientId: patient._id,
    tests: [{ testId: test._id, name: test.name, price: test.price }],
    status: 'scheduled',
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    walletAmountUsed: 0,
    homeSampling: {
      requested: true,
      address: 'House B, Street B, Lahore',
      scheduledAt: new Date(mondayDate.getTime() - 2 * 60 * 60 * 1000), // Monday at 8:00 AM
      region: 'lahore_johar_town',
      assignedStaffId: staffB._id,
    },
    notes: 'Test Auto - Preassigned to B',
  });

  // Create booking 1 via API at 10:00 AM
  const booking1Res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      tests: [test._id.toString()],
      homeSampling: {
        requested: true,
        region: 'lahore_johar_town',
        streetAddress: 'House 1',
        blockNumber: 'Block X',
        landmark: 'Main Gate',
        city: 'Lahore',
        country: 'Pakistan',
        scheduledAt: mondayDate.toISOString(),
      },
      notes: 'Test Auto - Booking 1',
    }),
  });

  const booking1Data = await booking1Res.json() as any;
  if (!booking1Data.success) throw new Error('Create booking 1 failed: ' + booking1Data.message);
  
  const updatedBooking1 = await waitForAssignment(booking1Data.data.booking._id);
  console.log(`Booking 1 assigned staff: ${updatedBooking1?.homeSampling.assignedStaffId}`);
  if (updatedBooking1?.homeSampling.assignedStaffId?.toString() !== staffA._id.toString()) {
    throw new Error(`Expected Booking 1 to be auto-assigned to Staff A (workload 0) instead of Staff B (workload 1) or Staff C (different region). Got: ${updatedBooking1?.homeSampling.assignedStaffId}`);
  }
  console.log('✅ Test 1 Passed: Correctly assigned to staff with lowest workload.');

  // --- TEST 2: TRAVEL TIME BUFFER CONFLICT ---
  // Create booking 2 for Monday at 10:30 AM in Gulberg (different region)
  // Staff A is currently at Johar Town at 10:00 AM (Booking 1).
  // Finishing collection at 10:30 AM, travel to Gulberg takes 45 minutes (different region), so earliest arrival is 11:15 AM.
  // This means Staff A should be rejected for 10:30 AM due to travel conflict.
  // Staff C covers Gulberg, has 0 workload, and is free. Staff C should be assigned.
  console.log('\n--- Running Test 2: Travel Buffer Conflict ---');
  
  const booking2Res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      tests: [test._id.toString()],
      homeSampling: {
        requested: true,
        region: 'lahore_gulberg',
        streetAddress: 'House 2',
        city: 'Lahore',
        country: 'Pakistan',
        scheduledAt: new Date(mondayDate.getTime() + 30 * 60 * 1000).toISOString(), // 10:30 AM
      },
      notes: 'Test Auto - Booking 2',
    }),
  });

  const booking2Data = await booking2Res.json() as any;
  if (!booking2Data.success) throw new Error('Create booking 2 failed: ' + booking2Data.message);

  const updatedBooking2 = await waitForAssignment(booking2Data.data.booking._id);
  console.log(`Booking 2 assigned staff: ${updatedBooking2?.homeSampling.assignedStaffId}`);
  if (updatedBooking2?.homeSampling.assignedStaffId?.toString() !== staffC._id.toString()) {
    throw new Error(`Expected Booking 2 to be assigned to Staff C (free) because Staff A has travel conflict. Got: ${updatedBooking2?.homeSampling.assignedStaffId}`);
  }
  console.log('✅ Test 2 Passed: Travel buffer correctly rejected candidate and matched free staff.');

  // --- TEST 3: FALLBACK TO PENDING MANUAL ASSIGNMENT ---
  // Create booking 3 for DHA Lahore (covered by Staff B, but wait: Staff B doesn't cover DHA Lahore. Only Staff A covers Gulberg/Johar, Staff B covers Johar, Staff C covers Gulberg. DHA Lahore is not covered by any staff).
  // Status should transition to pending_manual_assignment.
  console.log('\n--- Running Test 3: Fallback when no candidates ---');

  const booking3Res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      tests: [test._id.toString()],
      homeSampling: {
        requested: true,
        region: 'lahore_dha_lahore', // No active staff assigned to DHA
        streetAddress: 'House 3',
        city: 'Lahore',
        country: 'Pakistan',
        scheduledAt: mondayDate.toISOString(),
      },
      notes: 'Test Auto - Booking 3',
    }),
  });

  const booking3Data = await booking3Res.json() as any;
  if (!booking3Data.success) throw new Error('Create booking 3 failed: ' + booking3Data.message);

  const updatedBooking3 = await waitForAssignment(booking3Data.data.booking._id);
  console.log(`Booking 3 status: ${updatedBooking3?.status}, assigned staff: ${updatedBooking3?.homeSampling.assignedStaffId}`);
  if (updatedBooking3?.status !== 'pending_manual_assignment' || updatedBooking3?.homeSampling.assignedStaffId !== null) {
    throw new Error(`Expected Booking 3 to have status 'pending_manual_assignment' and no staff. Got status: ${updatedBooking3?.status}`);
  }
  console.log('✅ Test 3 Passed: Fallback to pending_manual_assignment succeeded.');

  // --- TEST 4: CONCURRENCY TRANSACTIONS ---
  // We will trigger multiple concurrent autoAssignStaff calls for a single slot.
  // There is only 1 staff member covering DHA Lahore (let's assign Staff A to DHA Lahore).
  // If we call autoAssignStaff concurrently on 2 different bookings for the same time slot,
  // the database transaction must ensure that only one booking gets assigned, and the other transitions to pending_manual_assignment (or throws/fails and is retried/handled).
  console.log('\n--- Running Test 4: Concurrency & Transaction safety ---');

  // Let Staff A also cover DHA Lahore
  await User.findByIdAndUpdate(staffA._id, { $push: { assignedRegions: 'lahore_dha_lahore' } });

  // Create two unassigned bookings at the same time: Monday 2:00 PM in DHA Lahore
  const timeSlot = new Date(mondayDate);
  timeSlot.setHours(14, 0, 0, 0); // 2:00 PM

  const cBooking1 = await Booking.create({
    patientId: patient._id,
    tests: [{ testId: test._id, name: test.name, price: test.price }],
    status: 'scheduled',
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    walletAmountUsed: 0,
    homeSampling: {
      requested: true,
      address: 'House C1, DHA Lahore',
      scheduledAt: timeSlot,
      region: 'lahore_dha_lahore',
      assignedStaffId: null,
    },
    notes: 'Test Auto - Concurrent 1',
  });

  const cBooking2 = await Booking.create({
    patientId: patient._id,
    tests: [{ testId: test._id, name: test.name, price: test.price }],
    status: 'scheduled',
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    walletAmountUsed: 0,
    homeSampling: {
      requested: true,
      address: 'House C2, DHA Lahore',
      scheduledAt: timeSlot,
      region: 'lahore_dha_lahore',
      assignedStaffId: null,
    },
    notes: 'Test Auto - Concurrent 2',
  });

  // Run autoAssignStaff concurrently
  console.log('Invoking autoAssignStaff concurrently...');
  const [res1, res2] = await Promise.allSettled([
    autoAssignStaff(cBooking1._id.toString()),
    autoAssignStaff(cBooking2._id.toString()),
  ]);

  const finalC1 = await Booking.findById(cBooking1._id);
  const finalC2 = await Booking.findById(cBooking2._id);

  console.log(`Concurrent Booking 1 assigned: ${finalC1?.homeSampling.assignedStaffId}`);
  console.log(`Concurrent Booking 2 assigned: ${finalC2?.homeSampling.assignedStaffId}`);

  const hasDoubleBooking = 
    finalC1?.homeSampling.assignedStaffId?.toString() === staffA._id.toString() &&
    finalC2?.homeSampling.assignedStaffId?.toString() === staffA._id.toString();

  if (hasDoubleBooking) {
    throw new Error('❌ CONCURRENCY FAILURE: Staff A was assigned to both concurrent bookings at the exact same slot!');
  }

  console.log('✅ Test 4 Passed: Transactions successfully prevented double assignment.');

  // Clean up
  console.log('\nCleaning up database...');
  await User.deleteMany({ email: /test_auto_/ });
  await TestCategory.deleteMany({ name: /Test Category Auto/ });
  await Test.deleteMany({ name: /Test Auto/ });
  await Booking.deleteMany({ notes: /Test Auto/ });
  await Subscription.deleteMany({ userId: patient._id });

  console.log('--- ALL AUTO-ASSIGN INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ AUTO-ASSIGN INTEGRATION TEST FAILED:', err);
  mongoose.disconnect();
  process.exit(1);
});

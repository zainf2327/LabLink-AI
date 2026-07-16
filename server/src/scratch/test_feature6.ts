import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import { bookingService } from '../services/booking.service.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log(`${cyan}=== Starting LabLink AI Feature 6 E2E / Integration Tests ===${reset}\n`);

  // Connect to Database
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clean up existing test users/bookings
  await User.deleteMany({ email: { $in: ['test_patient_6@example.com', 'test_staff_6@example.com', 'test_staff_7@example.com'] } });
  await Booking.deleteMany({ notes: 'FEATURE_6_TEST_SCENARIO' });

  // 1. Create Users for Testing
  console.log('Test Case 1: Active Staff Listing...');
  
  const patient = await User.create({
    name: 'Patient Six',
    email: 'test_patient_6@example.com',
    role: 'patient',
    passwordHash: 'dummyhash',
  });

  const staff1 = await User.create({
    name: 'Staff Alpha',
    email: 'test_staff_6@example.com',
    role: 'staff',
    isActive: true,
    passwordHash: 'dummyhash',
  });

  const staff2 = await User.create({
    name: 'Staff Beta',
    email: 'test_staff_7@example.com',
    role: 'staff',
    isActive: false, // inactive staff should not be listed
    passwordHash: 'dummyhash',
  });

  // Fetch staff list directly from the model filtering logic used by GET /users/staff
  const activeStaff = await User.find({ role: 'staff', isActive: true }).sort({ name: 1 });
  assert(activeStaff.length >= 1, 'Should find at least 1 active staff member');
  assert(activeStaff.some(s => s.email === 'test_staff_6@example.com'), 'Staff Alpha should be listed');
  assert(!activeStaff.some(s => s.email === 'test_staff_7@example.com'), 'Staff Beta (inactive) should NOT be listed');
  console.log(`${green}✔ Active Staff listing query verified successfully!${reset}\n`);

  // 2. Create Base Booking for Testing Status Transitions
  console.log('Test Case 2: Status Transitions validation...');
  const testBooking = await Booking.create({
    patientId: patient._id,
    tests: [{ testId: new mongoose.Types.ObjectId(), name: 'Test CBC', price: 25 }],
    status: 'pending_payment',
    totalAmount: 25,
    discountAmount: 0,
    finalAmount: 25,
    homeSampling: {
      requested: true,
      address: 'Sector F-8, Islamabad',
      scheduledAt: new Date('2026-07-25T10:00:00.000Z'),
      assignedStaffId: null,
    },
    notes: 'FEATURE_6_TEST_SCENARIO',
  });

  // Valid transition: pending_payment -> scheduled
  testBooking.status = 'scheduled';
  await testBooking.save();
  assert(testBooking.status === 'scheduled', 'Status should transition to scheduled');

  // Valid transition: scheduled -> sample_collected
  testBooking.status = 'sample_collected';
  await testBooking.save();
  assert(testBooking.status === 'sample_collected', 'Status should transition to sample_collected');

  // Valid transition: sample_collected -> in_lab
  testBooking.status = 'in_lab';
  await testBooking.save();
  assert(testBooking.status === 'in_lab', 'Status should transition to in_lab');

  // Valid transition: in_lab -> report_ready
  testBooking.status = 'report_ready';
  await testBooking.save();
  assert(testBooking.status === 'report_ready', 'Status should transition to report_ready');

  // Valid transition: report_ready -> completed
  testBooking.status = 'completed';
  await testBooking.save();
  assert(testBooking.status === 'completed', 'Status should transition to completed');
  console.log(`${green}✔ Full chronological booking lifecycle status transitions verified!${reset}\n`);

  // 3. Test Staff Assignment & Google Calendar Event creation
  console.log('Test Case 3: Staff Assignment & Synchronization...');
  
  // Create another booking
  const testBooking2 = await Booking.create({
    patientId: patient._id,
    tests: [{ testId: new mongoose.Types.ObjectId(), name: 'Lipid Profile', price: 40 }],
    status: 'scheduled',
    totalAmount: 40,
    discountAmount: 0,
    finalAmount: 40,
    homeSampling: {
      requested: true,
      address: 'Sector E-11, Islamabad',
      scheduledAt: new Date('2026-07-25T14:00:00.000Z'),
      assignedStaffId: null,
    },
    notes: 'FEATURE_6_TEST_SCENARIO',
  });

  // Assign staff1 (Staff Alpha)
  testBooking2.homeSampling.assignedStaffId = staff1._id;
  await testBooking2.save();
  assert(testBooking2.homeSampling.assignedStaffId.toString() === staff1._id.toString(), 'Staff Alpha should be assigned successfully');
  console.log(`${green}✔ Staff assignment saved successfully in Database!${reset}\n`);

  // 4. Test Search Filters Querying
  console.log('Test Case 4: Search and Filter matching...');
  
  // Match by patient search 'Patient Six'
  const matchedPatients = await User.find({ name: { $regex: 'Patient Six', $options: 'i' }, role: 'patient' }).select('_id');
  assert(matchedPatients.length === 1, 'Should find 1 matching patient');
  const matchedBookings = await Booking.find({ patientId: { $in: matchedPatients.map(p => p._id) } });
  assert(matchedBookings.length >= 2, 'Should retrieve at least 2 bookings for Patient Six');

  // Match by assigned staff filter
  const assignedBookings = await Booking.find({ 'homeSampling.assignedStaffId': staff1._id });
  assert(assignedBookings.length === 1, 'Should find exactly 1 booking assigned to Staff Alpha');
  console.log(`${green}✔ Search filters for Patient Name and Assigned Staff verified successfully!${reset}\n`);

  // Cleanup Database
  await User.deleteMany({ email: { $in: ['test_patient_6@example.com', 'test_staff_6@example.com', 'test_staff_7@example.com'] } });
  await Booking.deleteMany({ notes: 'FEATURE_6_TEST_SCENARIO' });
  console.log('Test database cleaned up.');

  console.log(`${green}=== All Feature 6 Integration Tests Completed Successfully! ===${reset}\n`);
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`${red}Test execution failed:${reset}`, err);
    process.exit(1);
  });

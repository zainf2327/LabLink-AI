import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const BASE_URL = `http://127.0.0.1:${env.PORT}/api/v1`;

async function testAssignStaff() {
  console.log('Connecting to database to locate test booking and staff...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to database.');

  // Find a staff user and a booking
  const staff = await User.findOne({ role: 'staff', email: 'staff@lablink.com' });
  if (!staff) {
    console.error('Seeded staff user not found in the database. Please ensure you ran seed.');
    process.exit(1);
  }
  console.log(`Found Staff User: ${staff.name} (${staff._id})`);

  // Find a booking that requested home sampling
  const booking = await Booking.findOne({ 'homeSampling.requested': true });
  if (!booking) {
    console.error('No home sampling booking found. Please seed the database first.');
    process.exit(1);
  }
  console.log(`Found Booking: ${booking._id} (Status: ${booking.status})`);

  // 1. Admin Login
  console.log('\n--- 1. Logging in as Admin to obtain JWT ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@lablink.com',
      password: 'password123',
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login API Status:', loginRes.status);
  console.log('Login API Response:', JSON.stringify(loginData, null, 2));

  if (loginRes.status !== 200) {
    console.error('Admin login failed. Cannot proceed with api tests.');
    process.exit(1);
  }
  const adminToken = loginData.accessToken;

  // 2. Fetch staff list via API (GET /users/staff)
  console.log('\n--- 2. Fetching staff list via GET /users/staff ---');
  const staffRes = await fetch(`${BASE_URL}/users/staff`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  const staffData = await staffRes.json();
  console.log('GET /users/staff Status:', staffRes.status);
  console.log('GET /users/staff Response:', JSON.stringify(staffData, null, 2));

  // 3. Assign staff to the booking
  console.log(`\n--- 3. Assigning staff ${staff.name} to Booking ${booking._id} ---`);
  const assignRes = await fetch(`${BASE_URL}/bookings/${booking._id}/assign-staff`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignedStaffId: staff._id.toString()
    })
  });
  const assignData = await assignRes.json();
  console.log('PATCH /bookings/:id/assign-staff Status:', assignRes.status);
  console.log('PATCH /bookings/:id/assign-staff Response:', JSON.stringify(assignData, null, 2));

  // 4. Verify assignment via GET /bookings/:id
  console.log(`\n--- 4. Verifying booking details via GET /bookings/${booking._id} ---`);
  const verifyRes = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  const verifyData = await verifyRes.json();
  console.log('GET /bookings/:id Status:', verifyRes.status);
  console.log('Assigned Staff ID in response:', verifyData.data?.booking?.homeSampling?.assignedStaffId);
  console.log('Is successfully assigned:', verifyData.data?.booking?.homeSampling?.assignedStaffId === staff._id.toString() ? 'YES' : 'NO');

  // 5. Try to unassign staff
  console.log(`\n--- 5. Unassigning staff (setting to null) for Booking ${booking._id} ---`);
  const unassignRes = await fetch(`${BASE_URL}/bookings/${booking._id}/assign-staff`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignedStaffId: null
    })
  });
  const unassignData = await unassignRes.json();
  console.log('PATCH /bookings/:id/assign-staff (unassign) Status:', unassignRes.status);
  console.log('PATCH /bookings/:id/assign-staff (unassign) Response:', JSON.stringify(unassignData, null, 2));

  // 6. Verify unassignment via GET /bookings/:id
  console.log(`\n--- 6. Verifying unassignment via GET /bookings/${booking._id} ---`);
  const verifyRes2 = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  const verifyData2 = await verifyRes2.json();
  console.log('GET /bookings/:id Status:', verifyRes2.status);
  console.log('Assigned Staff ID in response:', verifyData2.data?.booking?.homeSampling?.assignedStaffId);
  console.log('Is successfully unassigned:', verifyData2.data?.booking?.homeSampling?.assignedStaffId === null ? 'YES' : 'NO');

  await mongoose.disconnect();
  console.log('\nDisconnected from database. Tests finished.');
  process.exit(0);
}

testAssignStaff().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

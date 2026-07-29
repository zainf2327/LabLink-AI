import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import User from '../models/User.model.js';
import Region from '../models/Region.model.js';
import AuditLog from '../models/AuditLog.model.js';
import { env } from '../config/env.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = env.MONGODB_URI;
const API_URL = `http://127.0.0.1:${env.PORT}/api/v1`;

async function runTests() {
  console.log('--- STARTING STAFF INTEGRATION TESTS ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Database.');

  // Create or verify Admin in DB
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  let admin = await User.findOne({ email: 'admin@lablink.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin@lablink.com',
      passwordHash,
      phone: '+923001234567',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
  }

  // Create a dummy region
  const regionId = `region_test_${Date.now()}`;
  const dummyRegion = await Region.create({
    _id: regionId,
    city: 'Lahore',
    name: 'Test Area',
    country: 'Pakistan',
    isActive: true,
  });
  console.log(`Created dummy active region: ${regionId}`);

  // 1. Log in as admin via API to get token
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lablink.com', password: 'password123' }),
  });
  const adminLogin = await adminLoginRes.json() as any;
  if (!adminLogin.success) throw new Error('Admin login failed: ' + adminLogin.message);
  const adminToken = adminLogin.accessToken;
  console.log('Logged in Admin.');

  // 2. Admin creates a new staff account
  const staffEmail = `staff_${Date.now()}@test.com`;
  const createStaffRes = await fetch(`${API_URL}/users/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Test Staff Member',
      email: staffEmail,
    }),
  });
  const createStaffData = await createStaffRes.json() as any;
  if (!createStaffData.success) throw new Error('Staff creation failed: ' + createStaffData.message);
  const staffId = createStaffData.data.user.id;
  console.log(`Admin created staff: ${staffEmail} (ID: ${staffId})`);

  // Verify staff role & properties in DB
  const staffInDb = await User.findById(staffId);
  if (!staffInDb) throw new Error('Staff not found in database after creation');
  if (staffInDb.role !== 'staff') throw new Error('Created user role is not staff');
  if (!staffInDb.isActive) throw new Error('Created staff is not active by default');
  if (!staffInDb.isVerified) throw new Error('Created staff is not verified by default');
  console.log('Verified staff db state.');

  // Verify CREATE_STAFF Audit Log
  const createAudit = await AuditLog.findOne({ action: 'CREATE_STAFF', targetId: staffId });
  if (!createAudit) throw new Error('Audit log for CREATE_STAFF not found');
  console.log('Verified CREATE_STAFF audit log entry.');

  // 3. Admin assigns region to active staff
  const assignRegionRes = await fetch(`${API_URL}/users/${staffId}/regions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      regions: [regionId],
    }),
  });
  const assignRegionData = await assignRegionRes.json() as any;
  if (!assignRegionData.success) throw new Error('Region assignment failed: ' + assignRegionData.message);
  console.log('Assigned region to active staff member.');

  // Verify region assignment in DB
  const staffAfterAssign = await User.findById(staffId);
  if (!staffAfterAssign?.assignedRegions.includes(regionId)) {
    throw new Error('Assigned region not reflected in staff member record');
  }

  // 4. Admin deactivates staff member
  const deactivateRes = await fetch(`${API_URL}/users/${staffId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      isActive: false,
    }),
  });
  const deactivateData = await deactivateRes.json() as any;
  if (!deactivateData.success) throw new Error('Staff deactivation failed: ' + deactivateData.message);
  console.log('Deactivated staff member.');

  // Verify status in DB
  const staffAfterDeactivate = await User.findById(staffId);
  if (staffAfterDeactivate?.isActive) throw new Error('Staff member is still active in DB');

  // 5. Try to assign region to deactivated staff member (Should fail with 400)
  const assignRegionDeactivatedRes = await fetch(`${API_URL}/users/${staffId}/regions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      regions: [regionId],
    }),
  });
  const assignRegionDeactivatedData = await assignRegionDeactivatedRes.json() as any;
  if (assignRegionDeactivatedRes.status !== 400 || assignRegionDeactivatedData.success) {
    throw new Error(`Expected region assignment to inactive staff to fail with 400, got status ${assignRegionDeactivatedRes.status}: ${JSON.stringify(assignRegionDeactivatedData)}`);
  }
  console.log('✅ Correctly blocked region assignment to inactive staff member (returned 400 Bad Request).');

  // 6. Reset password for staff member
  const resetPassRes = await fetch(`${API_URL}/users/staff/${staffId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  const resetPassData = await resetPassRes.json() as any;
  if (!resetPassData.success) throw new Error('Password reset failed: ' + resetPassData.message);
  console.log('Reset staff password successfully.');

  // Verify RESET_STAFF_PASSWORD Audit Log
  const resetAudit = await AuditLog.findOne({ action: 'RESET_STAFF_PASSWORD', targetId: staffId });
  if (!resetAudit) throw new Error('Audit log for RESET_STAFF_PASSWORD not found');
  console.log('Verified RESET_STAFF_PASSWORD audit log entry.');

  // Clean up
  await User.deleteOne({ _id: staffId });
  await Region.deleteOne({ _id: regionId });
  console.log('Cleaned up staff integration test records.');

  console.log('--- ALL STAFF INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ INTEGRATION TEST FAILED:', err);
  mongoose.disconnect();
  process.exit(1);
});

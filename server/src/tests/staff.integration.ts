import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.model.js';
import Region from '../models/Region.model.js';
import AuditLog from '../models/AuditLog.model.js';

describe('Staff Integration Tests', () => {
  let adminToken: string;
  let adminUser: any;
  let testRegion: any;
  const regionId = 'region_test_staff';

  beforeAll(async () => {
    // Create Admin in DB
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@lablink.com',
      passwordHash,
      phone: '+923001234567',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    // Create a active region
    testRegion = await Region.create({
      _id: regionId,
      city: 'Lahore',
      name: 'Test Area',
      country: 'Pakistan',
      isActive: true,
    });

    // Log in as admin to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@lablink.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    adminToken = loginRes.body.accessToken;
  });

  it('should complete staff lifecycle (create, assign regions, deactivate, and reset password)', async () => {
    // 1. Admin creates a new staff account
    const staffEmail = `staff_${Date.now()}@test.com`;
    const createStaffRes = await request(app)
      .post('/api/v1/users/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Staff Member',
        email: staffEmail,
      });

    expect(createStaffRes.status).toBe(201);
    expect(createStaffRes.body.success).toBe(true);
    const staffId = createStaffRes.body.data.user.id;

    // Verify staff role & properties in DB
    const staffInDb = await User.findById(staffId);
    expect(staffInDb).toBeDefined();
    expect(staffInDb!.role).toBe('staff');
    expect(staffInDb!.isActive).toBe(true);
    expect(staffInDb!.isVerified).toBe(true);

    // Verify CREATE_STAFF Audit Log
    const createAudit = await AuditLog.findOne({ action: 'CREATE_STAFF', targetId: staffId });
    expect(createAudit).toBeDefined();

    // 2. Admin assigns region to active staff
    const assignRegionRes = await request(app)
      .patch(`/api/v1/users/${staffId}/regions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        regions: [regionId],
      });

    expect(assignRegionRes.status).toBe(200);
    expect(assignRegionRes.body.success).toBe(true);

    // Verify region assignment in DB
    const staffAfterAssign = await User.findById(staffId);
    expect(staffAfterAssign!.assignedRegions).toContain(regionId);

    // 3. Admin deactivates staff member
    const deactivateRes = await request(app)
      .patch(`/api/v1/users/${staffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: false,
      });

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.success).toBe(true);

    // Verify status in DB
    const staffAfterDeactivate = await User.findById(staffId);
    expect(staffAfterDeactivate!.isActive).toBe(false);

    // 4. Try to assign region to deactivated staff member (Should fail with 400)
    const assignRegionDeactivatedRes = await request(app)
      .patch(`/api/v1/users/${staffId}/regions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        regions: [regionId],
      });

    expect(assignRegionDeactivatedRes.status).toBe(400);
    expect(assignRegionDeactivatedRes.body.success).toBe(false);

    // 5. Reset password for staff member
    const resetPassRes = await request(app)
      .post(`/api/v1/users/staff/${staffId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(resetPassRes.status).toBe(200);
    expect(resetPassRes.body.success).toBe(true);

    // Verify RESET_STAFF_PASSWORD Audit Log
    const resetAudit = await AuditLog.findOne({ action: 'RESET_STAFF_PASSWORD', targetId: staffId });
    expect(resetAudit).toBeDefined();
  });
});

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import Report from '../models/Report.model.js';
import dns from 'dns';
import bcrypt from 'bcryptjs';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const BASE_URL = `http://127.0.0.1:${env.PORT}/api/v1`;
const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
async function runTests() {
    console.log(`${cyan}=== Starting LabLink AI Feature 7 E2E / Integration Tests ===${reset}\n`);
    // Connect to Database
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');
    // Pre-test cleanup
    await User.deleteMany({ email: { $in: ['test_patient_7@example.com', 'test_patient_7b@example.com', 'test_staff_7@example.com', 'test_admin_7@example.com'] } });
    await Booking.deleteMany({ notes: 'FEATURE_7_TEST_SCENARIO' });
    await Report.deleteMany({}); // clean reports to prevent conflict
    console.log('Database cleaned. Seeding test users and bookings...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    // 1. Create Users
    const patient = await User.create({
        name: 'Patient Seven',
        email: 'test_patient_7@example.com',
        role: 'patient',
        passwordHash,
        isActive: true,
    });
    const patientB = await User.create({
        name: 'Patient Seven B',
        email: 'test_patient_7b@example.com',
        role: 'patient',
        passwordHash,
        isActive: true,
    });
    const staff = await User.create({
        name: 'Staff Seven',
        email: 'test_staff_7@example.com',
        role: 'staff',
        passwordHash,
        isActive: true,
    });
    const admin = await User.create({
        name: 'Admin Seven',
        email: 'test_admin_7@example.com',
        role: 'admin',
        passwordHash,
        isActive: true,
    });
    // 2. Create Booking in 'in_lab' status
    const booking = await Booking.create({
        patientId: patient._id,
        tests: [{ testId: new mongoose.Types.ObjectId(), name: 'Hematology Screening', price: 40 }],
        status: 'in_lab',
        totalAmount: 40,
        discountAmount: 0,
        finalAmount: 40,
        homeSampling: {
            requested: true,
            address: '123 Test St',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        notes: 'FEATURE_7_TEST_SCENARIO',
    });
    console.log(`Test users and Booking created. Booking status: ${booking.status}`);
    // 3. Login users via API to get tokens
    const loginResStaff = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staff.email, password: 'password123' }),
    });
    const staffToken = (await loginResStaff.json()).accessToken;
    const loginResPatient = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patient.email, password: 'password123' }),
    });
    const patientToken = (await loginResPatient.json()).accessToken;
    const loginResPatientB = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patientB.email, password: 'password123' }),
    });
    const patientBToken = (await loginResPatientB.json()).accessToken;
    const loginResAdmin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin.email, password: 'password123' }),
    });
    const adminToken = (await loginResAdmin.json()).accessToken;
    console.log('Logged in all test users and acquired tokens.');
    // 4. Test Case 1: Upload report (multipart/form-data)
    console.log('\nTest Case 1: Uploading PDF Report...');
    const formData = new FormData();
    formData.append('bookingId', booking._id.toString());
    // Minimal valid PDF header and content to pass basic library check (like pdf-parse)
    const dummyPdfBytes = Buffer.from('%PDF-1.4\n' +
        '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
        '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n' +
        '3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n' +
        '4 0 obj <</Length 44>> stream\n' +
        'BT\n' +
        '/F1 12 Tf\n' +
        '72 712 Td\n' +
        '(Patient Hematology Results: normal cell counts.) Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n' +
        'xref\n' +
        '0 5\n' +
        '0000000000 65535 f\n' +
        '0000000009 00000 n\n' +
        '0000000058 00000 n\n' +
        '0000000115 00000 n\n' +
        '0000000222 00000 n\n' +
        'trailer <</Size 5 /Root 1 0 R>>\n' +
        'startxref\n' +
        '317\n' +
        '%%EOF');
    const blob = new Blob([dummyPdfBytes], { type: 'application/pdf' });
    formData.append('report', blob, 'results.pdf');
    const uploadRes = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${staffToken}` },
        body: formData,
    });
    const uploadData = await uploadRes.json();
    console.log('Upload response status:', uploadRes.status);
    console.log('Upload response body:', JSON.stringify(uploadData, null, 2));
    assert(uploadRes.status === 201, 'Should return status 201 Created');
    assert(uploadData.success === true, 'Upload API should indicate success');
    const reportId = uploadData.data?.report?._id;
    assert(reportId, 'Response should contain report id');
    assert(uploadData.data?.report?.fileKey === `reports/${booking._id}.pdf`, 'FileKey should match booking naming format');
    assert(uploadData.data?.report?.textContent.includes('Patient Hematology Results'), 'Text content should be parsed successfully by pdf-parse');
    // Verify Booking status transitioned to 'report_ready' in database
    const updatedBooking = await Booking.findById(booking._id);
    assert(updatedBooking?.status === 'report_ready', 'Booking status should transition to report_ready in database');
    console.log(`${green}✔ Upload and parsing successful! Booking status updated to report_ready.${reset}`);
    // 5. Test Case 2: Double upload conflict check
    console.log('\nTest Case 2: Double upload conflict check...');
    const uploadRes2 = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${staffToken}` },
        body: formData,
    });
    const uploadData2 = await uploadRes2.json();
    console.log('Conflict upload status:', uploadRes2.status);
    assert(uploadRes2.status === 409, 'Should reject duplicate upload with 409 Conflict');
    console.log(`${green}✔ Duplicate upload conflict prevented!${reset}`);
    // 6. Test Case 3: Patient retrieves report list with signed URLs
    console.log('\nTest Case 3: Retrieving patient reports list...');
    const patientRes = await fetch(`${BASE_URL}/reports/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${patientToken}` },
    });
    const patientData = await patientRes.json();
    console.log('Get /reports/me status:', patientRes.status);
    assert(patientRes.status === 200, 'Should return 200 OK');
    assert(patientData.data.reports.length === 1, 'Should find 1 report for patient');
    assert(patientData.data.reports[0].fileUrl.includes('mock-signature=true') || patientData.data.reports[0].fileUrl.includes('AWSAccessKeyId'), 'Should return a pre-signed URL');
    console.log(`${green}✔ Reports retrieved by patient with signed S3 URLs!${reset}`);
    // 7. Test Case 4: Cross-patient access validation
    console.log('\nTest Case 4: Testing unauthorized patient access...');
    const detailResB = await fetch(`${BASE_URL}/reports/${reportId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${patientBToken}` },
    });
    console.log('Access by Patient B status:', detailResB.status);
    assert(detailResB.status === 403, 'Should block unauthorized patient access with 403 Forbidden');
    console.log(`${green}✔ Cross-patient unauthorized access successfully blocked!${reset}`);
    // 8. Test Case 5: Admin deletion
    console.log('\nTest Case 5: Testing Admin Deletion...');
    // Verify staff cannot delete it
    const deleteStaffRes = await fetch(`${BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${staffToken}` },
    });
    console.log('Delete by Staff status:', deleteStaffRes.status);
    assert(deleteStaffRes.status === 403, 'Staff deletion should be blocked with 403 Forbidden');
    // Verify Admin can delete it
    const deleteAdminRes = await fetch(`${BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    console.log('Delete by Admin status:', deleteAdminRes.status);
    assert(deleteAdminRes.status === 200, 'Admin deletion should succeed with 200 OK');
    const reportInDb = await Report.findById(reportId);
    assert(!reportInDb, 'Report should be deleted from DB');
    console.log(`${green}✔ Deletion privileges and execution verified successfully!${reset}`);
    // Cleanup DB users & scenarios
    await User.deleteMany({ email: { $in: ['test_patient_7@example.com', 'test_patient_7b@example.com', 'test_staff_7@example.com', 'test_admin_7@example.com'] } });
    await Booking.deleteMany({ notes: 'FEATURE_7_TEST_SCENARIO' });
    await mongoose.disconnect();
    console.log(`\n${green}=== All Feature 7 Integration Tests Completed Successfully! ===${reset}\n`);
}
runTests().catch((err) => {
    console.error(`${red}Test execution failed:${reset}`, err);
    process.exit(1);
});

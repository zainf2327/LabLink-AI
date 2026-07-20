import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import User from '../models/User.model.js';
import Report from '../models/Report.model.js';
import Booking from '../models/Booking.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import { env } from '../config/env.js';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const MONGODB_URI = env.MONGODB_URI;
const API_URL = `http://localhost:${env.PORT}/api/v1`;
async function runTests() {
    console.log('--- STARTING AI ASSISTANT INTEGRATION TESTS ---');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database.');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    // 1. Create Patient 1 and Patient 2 directly in DB
    const patient1Email = `p1_${Date.now()}@test.com`;
    const patient1 = await User.create({
        name: 'Patient One',
        email: patient1Email,
        passwordHash,
        role: 'patient',
        isVerified: true,
        isActive: true,
    });
    const patient2Email = `p2_${Date.now()}@test.com`;
    const patient2 = await User.create({
        name: 'Patient Two',
        email: patient2Email,
        passwordHash,
        role: 'patient',
        isVerified: true,
        isActive: true,
    });
    // Create Staff for uploading report
    const staffEmail = `staff_${Date.now()}@test.com`;
    const staff = await User.create({
        name: 'Staff User',
        email: staffEmail,
        passwordHash,
        role: 'staff',
        isVerified: true,
        isActive: true,
    });
    console.log('Created Patient 1, Patient 2, and Staff users.');
    // Log in all users
    const getAuthToken = async (email) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' }),
        });
        const data = await res.json();
        if (!data.success)
            throw new Error(`Login failed for ${email}: ` + data.message);
        return data.accessToken;
    };
    const p1Token = await getAuthToken(patient1Email);
    const p2Token = await getAuthToken(patient2Email);
    const staffToken = await getAuthToken(staffEmail);
    console.log('Logged in all users.');
    // Create a mock Booking and Report for Patient 1
    const mockBooking = await Booking.create({
        patientId: patient1._id,
        tests: [{
                testId: new mongoose.Types.ObjectId(),
                name: 'Hemoglobin A1C',
                price: 29.99
            }],
        status: 'in_lab',
        totalAmount: 29.99,
        finalAmount: 29.99,
        homeSampling: {
            requested: false,
            address: '',
            scheduledAt: new Date(),
            assignedStaffId: null
        },
        notes: 'Integration test booking',
    });
    const mockReport = await Report.create({
        bookingId: mockBooking._id,
        patientId: patient1._id,
        fileUrl: 'https://lablink-reports.s3.amazonaws.com/test-report.pdf',
        fileKey: 'reports/test-report.pdf',
        mimeType: 'application/pdf',
        uploadedBy: staff._id,
        tags: ['blood'],
        textContent: 'Patient Hemoglobin level is 14.5 g/dL. Glucose level is 95 mg/dL.',
        vectorized: true,
        summary: 'Your blood test shows normal hemoglobin (14.5 g/dL) and glucose (95 mg/dL) levels.',
        summaryGeneratedAt: new Date(),
    });
    console.log('Created mock booking and report for Patient 1.');
    // Test 1: Verify getMyReports returns the summary
    const getReportsRes = await fetch(`${API_URL}/reports/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${p1Token}` },
    });
    const getReportsData = await getReportsRes.json();
    if (!getReportsData.success)
        throw new Error('Failed to get reports: ' + getReportsData.message);
    const foundReport = getReportsData.data.reports.find((r) => r._id === mockReport._id.toString());
    if (!foundReport)
        throw new Error('Uploaded report not found in patient reports list');
    if (foundReport.summary !== mockReport.summary) {
        throw new Error(`Expected summary to match, got: ${foundReport.summary}`);
    }
    console.log('✅ Test 1 Passed: Summary successfully returned in patient reports list.');
    // Test 2: Verify Patient 1 can request chat history for own report (should be empty initially)
    const historyRes = await fetch(`${API_URL}/ai/chat/history?reportId=${mockReport._id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${p1Token}` },
    });
    const historyData = await historyRes.json();
    if (!historyData.success)
        throw new Error('Failed to get chat history: ' + historyData.message);
    if (historyData.data.messages.length !== 0) {
        throw new Error('Chat history should be empty initially');
    }
    console.log('✅ Test 2 Passed: Scoped chat history initialized as empty.');
    // Test 3: Verify Patient 2 is Forbidden (403) from fetching Patient 1's report chat history
    const historyP2Res = await fetch(`${API_URL}/ai/chat/history?reportId=${mockReport._id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${p2Token}` },
    });
    if (historyP2Res.status !== 403) {
        throw new Error('Patient 2 should be forbidden from accessing Patient 1\'s report history, got status: ' + historyP2Res.status);
    }
    console.log('✅ Test 3 Passed: Forbidden check correctly restricts history access.');
    // Test 4: Verify Patient 2 is Forbidden (403) from posting chat messages to Patient 1's report
    const chatP2Res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p2Token}`,
        },
        body: JSON.stringify({ message: 'What was my glucose?', reportId: mockReport._id }),
    });
    if (chatP2Res.status !== 403) {
        throw new Error('Patient 2 should be forbidden from sending chat to Patient 1\'s report, got status: ' + chatP2Res.status);
    }
    console.log('✅ Test 4 Passed: Forbidden check correctly restricts chat posting.');
    // Test 5: Verify POST /ai/chat without message or reportId returns 400 Bad Request
    const chatInvalidRes = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p1Token}`,
        },
        body: JSON.stringify({ message: 'Missing reportId' }),
    });
    if (chatInvalidRes.status !== 400) {
        throw new Error('Chat request without reportId should have returned 400, got: ' + chatInvalidRes.status);
    }
    console.log('✅ Test 5 Passed: Missing inputs correctly return 400.');
    // Clean up database records
    await User.deleteOne({ _id: patient1._id });
    await User.deleteOne({ _id: patient2._id });
    await User.deleteOne({ _id: staff._id });
    await Booking.deleteOne({ _id: mockBooking._id });
    await Report.deleteOne({ _id: mockReport._id });
    await ChatMessage.deleteMany({ reportId: mockReport._id });
    console.log('Cleaned up integration test records.');
    console.log('--- ALL AI ASSISTANT INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
    await mongoose.disconnect();
    process.exit(0);
}
runTests().catch(err => {
    console.error('❌ INTEGRATION TEST FAILED:', err);
    mongoose.disconnect();
    process.exit(1);
});

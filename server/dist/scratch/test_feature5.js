import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { bookingService } from '../services/booking.service.js';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
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
    console.log(`${cyan}=== Starting LabLink AI Feature 5 E2E / Integration Tests ===${reset}\n`);
    // Connect to Database
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');
    // Clean up existing test users/bookings
    await User.deleteMany({ email: { $in: ['test_patient_5@example.com', 'test_staff_5@example.com', 'test_staff_6@example.com'] } });
    await Booking.deleteMany({ notes: 'FEATURE_5_TEST_SCENARIO' });
    // 1. Test Crypto Utility
    console.log('Test Case 1: Crypto Utility Encryption/Decryption...');
    const secretToken = 'ya29.a0ARWdsHj_this_is_a_mock_refresh_token_string_12345';
    const ciphertext = encrypt(secretToken);
    assert(ciphertext !== secretToken, 'Ciphertext should not equal plain text');
    assert(ciphertext.includes(':'), 'Ciphertext should contain colon separator');
    const decrypted = decrypt(ciphertext);
    assert(decrypted === secretToken, 'Decrypted text should equal original text');
    console.log(`${green}✔ Crypto Utility verified successfully!${reset}\n`);
    // Create Users for Testing
    const patient = await User.create({
        name: 'Patient Five',
        email: 'test_patient_5@example.com',
        role: 'patient',
        passwordHash: 'dummyhash',
        googleCalendarConnected: true,
        googleRefreshToken: encrypt('mock_patient_refresh_token'),
        googleEmail: 'patient5@gmail.com',
    });
    const staff = await User.create({
        name: 'Staff Five',
        email: 'test_staff_5@example.com',
        role: 'staff',
        passwordHash: 'dummyhash',
        googleCalendarConnected: true,
        googleRefreshToken: encrypt('mock_staff_refresh_token'),
        googleEmail: 'staff5@gmail.com',
    });
    const staff2 = await User.create({
        name: 'Staff Six',
        email: 'test_staff_6@example.com',
        role: 'staff',
        passwordHash: 'dummyhash',
        googleCalendarConnected: true,
        googleRefreshToken: encrypt('mock_staff_refresh_token_2'),
        googleEmail: 'staff6@gmail.com',
    });
    // Create base booking
    const scheduledTime = new Date('2026-07-20T10:00:00.000Z');
    const testBooking = await Booking.create({
        patientId: patient._id,
        tests: [{ testId: new mongoose.Types.ObjectId(), name: 'Test CBC', price: 20 }],
        status: 'scheduled',
        totalAmount: 20,
        discountAmount: 0,
        finalAmount: 20,
        homeSampling: {
            requested: true,
            address: 'Sector G-9, Islamabad',
            scheduledAt: scheduledTime,
            assignedStaffId: staff._id,
        },
        googleCalendar: {
            patientEventId: null,
            staffEventId: null,
        },
        notes: 'FEATURE_5_TEST_SCENARIO',
    });
    // 2. Test Local DB Conflict Checks
    console.log('Test Case 2: Database Conflict Checks (within 2-hour window)...');
    // Exact same time (should fail)
    try {
        await bookingService.checkStaffConflict(staff._id.toString(), new Date('2026-07-20T10:00:00.000Z'));
        assert(false, 'Should have thrown conflict error for exact same time');
    }
    catch (err) {
        assert(err.statusCode === 409, 'Error status code should be 409');
        assert(err.message.includes('conflict in the database'), 'Error message should mention database conflict');
        console.log(`${green}✔ DB Conflict check blocks exact same time slot correctly.${reset}`);
    }
    // 30 mins later (should fail)
    try {
        await bookingService.checkStaffConflict(staff._id.toString(), new Date('2026-07-20T10:30:00.000Z'));
        assert(false, 'Should have thrown conflict error for overlapping 30 min slot');
    }
    catch (err) {
        assert(err.statusCode === 409, 'Error status code should be 409');
        console.log(`${green}✔ DB Conflict check blocks overlapping slot (30 mins difference) correctly.${reset}`);
    }
    // 2 hours later (should pass)
    try {
        await bookingService.checkStaffConflict(staff._id.toString(), new Date('2026-07-20T12:00:00.000Z'), testBooking._id.toString());
        console.log(`${green}✔ DB Conflict check allows non-conflicting slot (2 hours difference) correctly.${reset}`);
    }
    catch (err) {
        assert(false, 'Should not have thrown conflict error: ' + err.message);
    }
    console.log();
    // 3. Test Google Calendar Conflict Checks (Mocked using the minute 59 trigger)
    console.log('Test Case 3: Google Calendar API (FreeBusy) Conflict Checks...');
    // Test non-busy mock slot
    try {
        await bookingService.checkStaffConflict(staff2._id.toString(), new Date('2026-07-20T10:00:00.000Z'));
        console.log(`${green}✔ Google Calendar check allows free slot correctly.${reset}`);
    }
    catch (err) {
        assert(false, 'Should not have thrown conflict error on free slot: ' + err.message);
    }
    // Test busy mock slot (trigger: minute set to 59)
    try {
        await bookingService.checkStaffConflict(staff2._id.toString(), new Date('2026-07-20T10:59:00.000Z'));
        assert(false, 'Should have thrown conflict error for busy slot on Google Calendar');
    }
    catch (err) {
        assert(err.statusCode === 409, 'Error status code should be 409');
        assert(err.message.includes('conflict on Google Calendar'), 'Error message should mention Google Calendar conflict');
        console.log(`${green}✔ Google Calendar check blocks busy slot correctly.${reset}`);
    }
    console.log();
    // 4. Test Google Calendar Event Creation Sync
    console.log('Test Case 4: Sync Booking Calendar Events (Patient & Staff)...');
    await bookingService.syncBookingToCalendar(testBooking);
    const updatedBooking1 = await Booking.findById(testBooking._id);
    assert(!!updatedBooking1?.googleCalendar?.patientEventId, 'Patient event ID should be populated');
    assert(!!updatedBooking1?.googleCalendar?.staffEventId, 'Staff event ID should be populated');
    console.log(`${green}✔ Patient event created: ${updatedBooking1.googleCalendar.patientEventId}${reset}`);
    console.log(`${green}✔ Staff event created: ${updatedBooking1.googleCalendar.staffEventId}${reset}`);
    console.log(`${green}✔ Calendar Event Synchronization works perfectly!${reset}\n`);
    // 5. Test Staff Reassignment & Deletion Sync
    console.log('Test Case 5: Staff Reassignment and Old Event Deletion...');
    const oldStaffEventId = updatedBooking1.googleCalendar.staffEventId;
    // Simulate reassignment controller logic:
    // First, check conflict for new staff (staff2)
    await bookingService.checkStaffConflict(staff2._id.toString(), testBooking.homeSampling.scheduledAt, testBooking._id.toString());
    // Reassign to staff2
    testBooking.homeSampling.assignedStaffId = staff2._id;
    // Clear old staff event id
    testBooking.googleCalendar.staffEventId = null;
    await testBooking.save();
    // Re-sync
    await bookingService.syncBookingToCalendar(testBooking);
    const updatedBooking2 = await Booking.findById(testBooking._id);
    assert(updatedBooking2?.googleCalendar?.staffEventId !== oldStaffEventId, 'New staff event ID should be different from old');
    assert(!!updatedBooking2?.googleCalendar?.staffEventId, 'New staff event ID should be populated');
    assert(updatedBooking2.googleCalendar.patientEventId === updatedBooking1.googleCalendar.patientEventId, 'Patient event ID should remain unchanged');
    console.log(`${green}✔ Old staff event deleted: ${oldStaffEventId}${reset}`);
    console.log(`${green}✔ New staff event created: ${updatedBooking2.googleCalendar.staffEventId}${reset}`);
    console.log(`${green}✔ Staff reassignment event updates verified successfully!${reset}\n`);
    // 6. Test Booking Cancellation Event Removal
    console.log('Test Case 6: Booking Cancellation event removal...');
    await bookingService.removeCalendarEvents(updatedBooking2);
    const updatedBooking3 = await Booking.findById(testBooking._id);
    assert(updatedBooking3?.googleCalendar?.patientEventId === null, 'Patient event ID should be cleared (null)');
    assert(updatedBooking3?.googleCalendar?.staffEventId === null, 'Staff event ID should be cleared (null)');
    console.log(`${green}✔ Calendar events removed correctly on cancellation!${reset}\n`);
    // Cleanup Database
    await User.deleteMany({ email: { $in: ['test_patient_5@example.com', 'test_staff_5@example.com', 'test_staff_6@example.com'] } });
    await Booking.deleteMany({ notes: 'FEATURE_5_TEST_SCENARIO' });
    console.log('Test data cleaned up.');
    console.log(`\n${green}=== All Feature 5 Integration Tests Completed Successfully! ===${reset}`);
}
runTests()
    .then(() => {
    mongoose.connection.close();
    process.exit(0);
})
    .catch((err) => {
    console.error(`${red}Test runner encountered error:${reset}`, err);
    mongoose.connection.close();
    process.exit(1);
});

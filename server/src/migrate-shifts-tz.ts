import connectDB from './config/db.js';
import User from './models/User.model.js';
import mongoose from 'mongoose';
import logger from './utils/logger.js';

async function migrateShiftsTimezone() {
  try {
    logger.info('Starting shift timezone migration...');
    // Connect to DB
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established.');
    }

    const usersCollection = db.collection('users');

    // Find all users with role 'staff' using raw driver
    const staffUsers = await usersCollection.find({ role: 'staff' }).toArray();
    logger.info(`Found ${staffUsers.length} staff members in database.`);

    let updatedCount = 0;

    for (const staff of staffUsers) {
      let modified = false;

      if (staff.shifts && staff.shifts.length > 0) {
        for (const shift of staff.shifts) {
          // If timezone is missing in raw DB document, set it
          if (!shift.timezone) {
            shift.timezone = 'Asia/Karachi';
            modified = true;
          }
        }
      }

      if (modified) {
        await usersCollection.updateOne(
          { _id: staff._id },
          { $set: { shifts: staff.shifts } }
        );
        updatedCount++;
        logger.info(`Updated timezone for staff member: ${staff.name} (${staff.email})`);
      }
    }

    logger.info(`Migration complete. Updated ${updatedCount} staff members.`);
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
    process.exit(0);
  } catch (err: any) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateShiftsTimezone();

import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Report from '../models/Report.model.js';
import { s3Service } from '../services/s3.service.js';
async function run() {
    console.log('Connecting to MongoDB:', env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected!');
    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports in the database.`);
    for (const report of reports) {
        console.log(`Report ID: ${report._id}`);
        console.log(`- Patient ID: ${report.patientId}`);
        console.log(`- File Key: ${report.fileKey}`);
        try {
            const streamData = await s3Service.getFileStream(report.fileKey);
            if (streamData) {
                console.log(`- Stream retrieved successfully! Size: ${streamData.contentLength}, MIME: ${streamData.mimeType}`);
            }
            else {
                console.log(`- Stream retrieved as NULL!`);
            }
        }
        catch (err) {
            console.error(`- Error getting stream:`, err.message);
        }
    }
    await mongoose.disconnect();
}
run().catch(console.error);

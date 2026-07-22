import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/env.js';
import Report from '../models/Report.model.js';
dns.setServers(['8.8.8.8', '1.1.1.1']);
async function updateReport() {
    console.log('--- UPDATING REPORT IN DATABASE ---');
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected to DB.');
        const reportId = '6a5e0723e3a13ac3110d4a8c';
        const report = await Report.findById(reportId);
        if (!report) {
            console.error(`Report ${reportId} not found.`);
            process.exit(1);
        }
        const summaryText = "Your blood test results are normal. All the components of your blood, including red and white blood cells and platelets, are within the expected ranges. This suggests that your blood is healthy and functioning properly. The test did not find any abnormal cells or indications of underlying conditions such as anemia, infection, or bleeding disorders. Overall, the results indicate a healthy blood profile.\n\n⚕️ *Medical Disclaimer: This AI-generated summary provides informational context of your lab report only and is not a substitute for professional medical advice. Please consult your doctor.*";
        report.vectorized = true;
        report.summary = summaryText;
        report.summaryGeneratedAt = new Date();
        await report.save();
        console.log('Success! Report updated in DB with vectorized=true and summary text.');
    }
    catch (err) {
        console.error('Failed to update report:', err);
    }
    finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB.');
    }
}
updateReport();

import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Report from '../models/Report.model.js';
async function run() {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    const reportId = '6a5e0723e3a13ac3110d4a8c';
    const report = await Report.findById(reportId);
    if (!report) {
        console.error('Report not found!');
        await mongoose.disconnect();
        return;
    }
    const patient = await User.findById(report.patientId);
    if (!patient) {
        console.error('Patient not found!');
        await mongoose.disconnect();
        return;
    }
    console.log(`Testing report ${reportId} for patient ${patient.email}...`);
    // Generate self-signed JWT token
    console.log('Generating JWT Token...');
    const token = jwt.sign({ id: patient._id.toString(), email: patient.email, role: patient.role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    console.log('Token generated!');
    // Now call view endpoint
    const BASE_URL = 'http://localhost:5001/api/v1';
    console.log('Fetching PDF view endpoint...');
    const viewRes = await fetch(`${BASE_URL}/reports/${reportId}/view`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log('Response Status:', viewRes.status);
    console.log('Response Content-Type:', viewRes.headers.get('content-type'));
    console.log('Response Content-Disposition:', viewRes.headers.get('content-disposition'));
    if (!viewRes.ok) {
        console.error('Error body:', await viewRes.text());
    }
    else {
        const buffer = await viewRes.arrayBuffer();
        console.log(`Success! PDF fetched. Byte size: ${buffer.byteLength}`);
        const textSnippet = new TextDecoder('utf-8').decode(buffer.slice(0, Math.min(buffer.byteLength, 150)));
        console.log('First 150 chars:', textSnippet);
    }
    await mongoose.disconnect();
}
run().catch(console.error);

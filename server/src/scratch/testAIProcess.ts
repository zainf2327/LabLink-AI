import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/env.js';
import Report from '../models/Report.model.js';
import { aiAssistantService } from '../services/aiAssistant.service.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function testProcess() {
  console.log('--- TESTING REPORT AI PROCESS ---');
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB.');

    const reportId = '6a5e0723e3a13ac3110d4a8c';
    const report = await Report.findById(reportId);
    
    if (!report) {
      console.error(`Report ${reportId} not found in DB.`);
      process.exit(1);
    }

    console.log('Report text content length:', report.textContent.length);

    console.log('\n--- 1. Testing upsertReportVectors ---');
    try {
      const count = await aiAssistantService.upsertReportVectors(
        report.patientId.toString(),
        report._id.toString(),
        report.textContent
      );
      console.log(`Success! Upserted ${count} vectors to Pinecone.`);
    } catch (vectorErr: any) {
      console.error('❌ upsertReportVectors failed with error:', vectorErr.stack || vectorErr.message || vectorErr);
    }

    console.log('\n--- 2. Testing generateSummary ---');
    try {
      const summary = await aiAssistantService.generateSummary(report.textContent);
      console.log('Success! Summary generated:');
      console.log(summary);
    } catch (summaryErr: any) {
      console.error('❌ generateSummary failed with error:', summaryErr.stack || summaryErr.message || summaryErr);
    }

  } catch (err: any) {
    console.error('Database connection failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

testProcess();

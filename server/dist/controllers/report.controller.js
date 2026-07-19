import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.model.js';
import Report from '../models/Report.model.js';
import { s3Service } from '../services/s3.service.js';
import { pdfExtractService } from '../services/pdfExtract.service.js';
import { logAudit } from '../utils/auditLogger.js';
export const uploadReport = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const { bookingId } = req.body;
    const file = req.file;
    if (!bookingId) {
        res.status(400).json({ success: false, message: 'bookingId is required' });
        return;
    }
    if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    // 1. Fetch Booking and validate existence
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
    }
    // 2. Validate unique report constraint (1:1)
    const existingReport = await Report.findOne({ bookingId });
    if (existingReport) {
        res.status(409).json({ success: false, message: 'A report already exists for this booking' });
        return;
    }
    // 3. Check status is exactly 'in_lab'
    if (booking.status !== 'in_lab') {
        res.status(409).json({
            success: false,
            message: `Cannot upload report: booking status must be 'in_lab', but is currently '${booking.status}'`,
        });
        return;
    }
    const fileKey = `reports/${bookingId}.pdf`;
    let s3Url = '';
    try {
        // 4. Upload file to S3
        s3Url = await s3Service.uploadFile(file.buffer, fileKey, file.mimetype);
    }
    catch (err) {
        console.error('S3 Upload Failed:', err);
        res.status(500).json({ success: false, message: 'Failed to upload report to file storage' });
        return;
    }
    let textContent = '';
    try {
        // 5. Extract text from PDF
        textContent = await pdfExtractService.extractText(file.buffer);
    }
    catch (err) {
        console.error('PDF Text Extraction Failed:', err);
        // Cleanup S3 upload to avoid orphan files
        try {
            await s3Service.deleteFile(fileKey);
        }
        catch (cleanupErr) {
            console.error('Failed to cleanup S3 object after parsing error:', cleanupErr);
        }
        res.status(400).json({
            success: false,
            message: 'Failed to parse PDF text: ' + err.message,
        });
        return;
    }
    // 6. Create Report document
    const report = await Report.create({
        bookingId: booking._id,
        patientId: booking.patientId,
        fileUrl: s3Url,
        fileKey,
        mimeType: file.mimetype,
        uploadedBy: new mongoose.Types.ObjectId(req.user.id),
        tags: [],
        textContent,
        vectorized: false,
    });
    // 7. Update booking status to 'report_ready'
    booking.status = 'report_ready';
    await booking.save();
    // 8. Log Audit
    await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'UPLOAD_REPORT',
        targetModel: 'Report',
        targetId: report.id,
        metadata: { bookingId, fileKey },
    });
    // Generate a pre-signed URL for the immediate response
    const signedUrl = await s3Service.getPresignedDownloadUrl(fileKey);
    const reportObj = report.toObject();
    reportObj.fileUrl = signedUrl;
    res.status(201).json({
        success: true,
        data: { report: reportObj },
    });
});
export const getMyReports = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const reports = await Report.find({ patientId: req.user.id }).populate('bookingId', 'tests').sort({ createdAt: -1 });
    // Generate pre-signed download URLs on retrieval
    const reportsWithPresignedUrls = await Promise.all(reports.map(async (report) => {
        const reportObj = report.toObject();
        try {
            reportObj.fileUrl = await s3Service.getPresignedDownloadUrl(report.fileKey);
        }
        catch (err) {
            console.error(`Failed to pre-sign download URL for report ${report._id}:`, err);
        }
        return reportObj;
    }));
    res.status(200).json({
        success: true,
        data: { reports: reportsWithPresignedUrls },
    });
});
export const getReportById = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const report = await Report.findById(req.params.id).populate('bookingId', 'tests');
    if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
    }
    // Access Control: Patient can only view their own reports
    if (req.user.role === 'patient' && report.patientId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Access to another patient\'s report is denied' });
        return;
    }
    // Sign retrieval URL
    const reportObj = report.toObject();
    try {
        reportObj.fileUrl = await s3Service.getPresignedDownloadUrl(report.fileKey);
    }
    catch (err) {
        console.error(`Failed to sign download URL for report ${report._id}:`, err);
    }
    res.status(200).json({
        success: true,
        data: { report: reportObj },
    });
});
export const deleteReport = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const report = await Report.findById(req.params.id);
    if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
    }
    // 1. Delete physical object from S3
    try {
        await s3Service.deleteFile(report.fileKey);
    }
    catch (err) {
        console.error(`Failed to delete S3 file for key ${report.fileKey}:`, err);
        // Log failure but proceed with DB cleanup so records do not get orphaned
    }
    // 2. Delete database entry
    await Report.findByIdAndDelete(req.params.id);
    // 3. Log Audit
    await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'DELETE_REPORT',
        targetModel: 'Report',
        targetId: report.id,
        metadata: { fileKey: report.fileKey, bookingId: report.bookingId },
    });
    res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
    });
});

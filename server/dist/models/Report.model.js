import mongoose, { Schema } from 'mongoose';
const AccessLogSchema = new Schema({
    viewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, default: Date.now, required: true },
    role: { type: String, required: true },
});
const ReportSchema = new Schema({
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true, // Enforces 1:1 Booking ↔ Report
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: false },
    fileKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true }],
    textContent: { type: String, default: '' },
    vectorized: { type: Boolean, default: false, required: true },
    summary: { type: String, default: '' },
    summaryGeneratedAt: { type: Date, default: null },
    versionSuffix: { type: String, default: '' },
    lastViewedAt: { type: Date, default: null },
    accessLog: { type: [AccessLogSchema], default: [] },
}, {
    timestamps: true,
});
// Indexes
ReportSchema.index({ patientId: 1 });
const Report = mongoose.model('Report', ReportSchema);
export default Report;

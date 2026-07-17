import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  bookingId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  tags: string[];
  textContent: string;
  vectorized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // Enforces 1:1 Booking ↔ Report
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true }],
    textContent: { type: String, default: '' },
    vectorized: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReportSchema.index({ patientId: 1 });

const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;

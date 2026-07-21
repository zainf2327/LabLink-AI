import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingTest {
  testId: mongoose.Types.ObjectId;
  name: string;
  price: number;
}

export interface IBookingGoogleCalendar {
  patientEventId?: string | null;
  staffEventId?: string | null;
}

export interface IBookingHomeSampling {
  requested: boolean;
  address?: string;
  scheduledAt?: Date;
  assignedStaffId?: mongoose.Types.ObjectId | null;
  calendarEventId?: string | null; // deprecated
}

export interface IBooking extends Document {
  patientId: mongoose.Types.ObjectId;
  forMemberId?: mongoose.Types.ObjectId | null;
  tests: IBookingTest[];
  status: 'pending_payment' | 'scheduled' | 'sample_collected' | 'in_lab' | 'report_ready' | 'completed' | 'cancelled';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  walletAmountUsed: number;
  couponId?: mongoose.Types.ObjectId | null;
  homeSampling: IBookingHomeSampling;
  googleCalendar?: IBookingGoogleCalendar;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingTestSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
});

const BookingHomeSamplingSchema = new Schema({
  requested: { type: Boolean, default: false, required: true },
  address: { type: String, trim: true },
  scheduledAt: { type: Date },
  assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  calendarEventId: { type: String, default: null }, // deprecated
});

const BookingGoogleCalendarSchema = new Schema({
  patientEventId: { type: String, default: null },
  staffEventId: { type: String, default: null },
});

const BookingSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    forMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
    tests: {
      type: [BookingTestSchema],
      validate: [
        (val: IBookingTest[]) => val.length > 0,
        'Booking must contain at least one test',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed', 'cancelled'],
      default: 'pending_payment',
      required: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    walletAmountUsed: { type: Number, required: true, default: 0, min: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    homeSampling: { type: BookingHomeSamplingSchema, required: true },
    googleCalendar: { type: BookingGoogleCalendarSchema, default: () => ({}) },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ patientId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'homeSampling.assignedStaffId': 1 });
BookingSchema.index({ status: 1, 'homeSampling.scheduledAt': 1 });
BookingSchema.index({ patientId: 1, status: 1 });

const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;

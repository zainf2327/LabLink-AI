import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkShift {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  timezone: string;  // e.g. "Asia/Karachi"
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // optional for Google OAuth users
  phone?: string;
  role: 'patient' | 'staff' | 'admin';
  isActive: boolean;
  isVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  googleEmail?: string;
  googleRefreshToken?: string;
  googleCalendarConnected: boolean;
  walletBalance: number;
  assignedRegions: string[];
  shifts: IWorkShift[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
    passwordHash: { type: String }, // optional for Google login
    phone: {
      type: String,
      required: function (this: any) {
        return !this.googleId && this.role !== 'staff';
      },
      trim: true,
    },
    role: {
      type: String,
      enum: ['patient', 'staff', 'admin'],
      default: 'patient',
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    googleId: { type: String },
    googleEmail: { type: String },
    googleRefreshToken: { type: String },
    googleCalendarConnected: { type: Boolean, default: false, required: true },
    walletBalance: { type: Number, default: 0, min: 0, required: true },
    assignedRegions: { type: [String], default: [] },
    shifts: {
      type: [
        {
          dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
          timezone: { type: String, required: true, default: 'Asia/Karachi' },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ googleId: 1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;

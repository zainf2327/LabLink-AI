import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  role: 'patient' | 'staff' | 'admin';
  isActive: boolean;
  googleId?: string;
  googleEmail?: string;
  googleRefreshToken?: string;
  googleCalendarConnected: boolean;
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
    passwordHash: { type: String, required: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['patient', 'staff', 'admin'],
      default: 'patient',
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    googleId: { type: String, sparse: true, index: true },
    googleEmail: { type: String },
    googleRefreshToken: { type: String },
    googleCalendarConnected: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;

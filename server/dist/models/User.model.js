import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
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
    phone: { type: String, trim: true },
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
}, {
    timestamps: true,
});
// Indexes
UserSchema.index({ googleId: 1 });
const User = mongoose.model('User', UserSchema);
export default User;

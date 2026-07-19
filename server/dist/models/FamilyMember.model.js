import mongoose, { Schema } from 'mongoose';
const FamilyMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    relationship: { type: String, required: true, trim: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
}, {
    timestamps: true,
});
// Index to query family members by owner user
FamilyMemberSchema.index({ userId: 1 });
const FamilyMember = mongoose.model('FamilyMember', FamilyMemberSchema);
export default FamilyMember;

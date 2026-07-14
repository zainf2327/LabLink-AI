import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMember extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  dateOfBirth: Date;
  relationship: string;
  gender: 'male' | 'female' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    relationship: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to query family members by owner user
FamilyMemberSchema.index({ userId: 1 });

const FamilyMember = mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema);
export default FamilyMember;

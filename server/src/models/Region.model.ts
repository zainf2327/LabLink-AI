import mongoose, { Schema, Document } from 'mongoose';

export interface IRegion {
  _id: string; // e.g. 'lahore_johar_town'
  city: string; // e.g. 'Lahore'
  name: string; // e.g. 'Johar Town'
  country: string; // e.g. 'Pakistan'
  isActive: boolean;
}

const RegionSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: true,
  }
);

const Region = mongoose.model<IRegion>('Region', RegionSchema);
export default Region;

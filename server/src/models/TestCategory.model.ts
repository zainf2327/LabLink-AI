import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const TestCategory = mongoose.model<ITestCategory>('TestCategory', TestCategorySchema);
export default TestCategory;

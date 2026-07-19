import mongoose, { Schema } from 'mongoose';
const TestSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['lab', 'radiology'],
        required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'TestCategory', required: true },
    price: { type: Number, required: true, min: 0 },
    preparationInstructions: { type: String, trim: true },
    duration: { type: String, required: true, trim: true }, // Turnaround time (e.g. "24 hours", "2 days")
    isHomeCollectionAvailable: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
}, {
    timestamps: true,
});
// Indexes
TestSchema.index({ type: 1 });
TestSchema.index({ categoryId: 1 });
TestSchema.index({ isActive: 1 });
const Test = mongoose.model('Test', TestSchema);
export default Test;

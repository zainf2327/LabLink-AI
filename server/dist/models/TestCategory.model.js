import mongoose, { Schema } from 'mongoose';
const TestCategorySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
}, {
    timestamps: true,
});
const TestCategory = mongoose.model('TestCategory', TestCategorySchema);
export default TestCategory;

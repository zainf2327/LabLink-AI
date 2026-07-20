import mongoose, { Schema } from 'mongoose';
const ChatMessageSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportId: {
        type: Schema.Types.ObjectId,
        ref: 'Report',
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes
ChatMessageSchema.index({ reportId: 1, createdAt: 1 });
ChatMessageSchema.index({ patientId: 1 });
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;

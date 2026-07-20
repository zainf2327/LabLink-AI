import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  patientId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatMessageSchema.index({ reportId: 1, createdAt: 1 });
ChatMessageSchema.index({ patientId: 1 });

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;

import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  patientId: mongoose.Types.ObjectId;
  reportId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  referencedReports?: mongoose.Types.ObjectId[];
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
      required: false,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: false,
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
    referencedReports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatMessageSchema.index({ reportId: 1, createdAt: 1 });
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ patientId: 1 });

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;

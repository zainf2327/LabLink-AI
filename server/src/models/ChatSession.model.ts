import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  patientId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatSessionSchema.index({ patientId: 1, createdAt: -1 });

const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
export default ChatSession;

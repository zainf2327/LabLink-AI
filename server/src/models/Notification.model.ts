import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'booking' | 'report' | 'subscription' | 'general';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['booking', 'report', 'subscription', 'general'],
      default: 'general',
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true, required: true },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;

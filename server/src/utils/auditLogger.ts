import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.model.js';

export interface AuditLogPayload {
  actorId: mongoose.Types.ObjectId | string;
  actorRole: string;
  action: string;
  targetModel: string;
  targetId: mongoose.Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export const logAudit = async (payload: AuditLogPayload): Promise<void> => {
  try {
    await AuditLog.create(payload);
  } catch (error) {
    console.error('Failed to save audit log:', error);
    throw error;
  }
};

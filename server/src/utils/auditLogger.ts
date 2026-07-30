import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.model.js';
import logger from './logger.js';

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
    logger.error('Failed to save audit log:', error);
    throw error;
  }
};

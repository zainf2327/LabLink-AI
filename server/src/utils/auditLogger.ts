import mongoose from 'mongoose';

export interface AuditLogPayload {
  actorId: mongoose.Types.ObjectId | string;
  actorRole: string;
  action: string;
  targetModel: string;
  targetId: mongoose.Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export const logAudit = async (payload: AuditLogPayload): Promise<void> => {
  // Stub for now. Will be fully implemented in Feature 12.
  console.log(`[AuditLog Stub] Action: ${payload.action} by ${payload.actorRole} (${payload.actorId})`);
};

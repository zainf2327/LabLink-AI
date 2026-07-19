import AuditLog from '../models/AuditLog.model.js';
export const logAudit = async (payload) => {
    try {
        await AuditLog.create(payload);
    }
    catch (error) {
        console.error('Failed to save audit log:', error);
        throw error;
    }
};

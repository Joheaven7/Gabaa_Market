import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

export interface LogAuditOptions {
  actorId?: string | mongoose.Types.ObjectId;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSummary?: string;
  afterSummary?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(options: LogAuditOptions): Promise<void> {
  try {
    await AuditLog.create({
      actorId: options.actorId ? new mongoose.Types.ObjectId(options.actorId.toString()) : undefined,
      actorRole: options.actorRole,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      beforeSummary: options.beforeSummary,
      afterSummary: options.afterSummary,
      ip: options.ip,
      metadata: options.metadata,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Audit log failure should not crash transaction, but is reported
  }
}

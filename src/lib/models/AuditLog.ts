import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;
  action: string; // E.g., 'SELLER_APPROVED', 'PRODUCT_MODERATED', 'REMITTANCE_VERIFIED', 'SETTLEMENT_APPROVED'
  entityType: string; // E.g., 'SellerProfile', 'Product', 'CommissionRemittance', 'Settlement', 'Order'
  entityId: string;
  beforeSummary?: string;
  afterSummary?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    beforeSummary: { type: String },
    afterSummary: { type: String },
    ip: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

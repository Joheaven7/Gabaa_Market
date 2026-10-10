import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationJob extends Document {
  eventType: string; // e.g. 'ORDER_CONFIRMED', 'SELLER_ORDER_DISPATCHED', 'COMMISSION_OVERDUE'
  entityId: string;
  recipient: string; // phone or email
  channel: "SMS" | "EMAIL" | "SYSTEM";
  payload: Record<string, any>;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  attemptCount: number;
  nextAttemptAt: Date;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationJobSchema = new Schema<INotificationJob>(
  {
    eventType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    recipient: { type: String, required: true },
    channel: { type: String, enum: ["SMS", "EMAIL", "SYSTEM"], default: "SYSTEM" },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    attemptCount: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

export const NotificationJob: Model<INotificationJob> =
  mongoose.models.NotificationJob ||
  mongoose.model<INotificationJob>("NotificationJob", NotificationJobSchema);

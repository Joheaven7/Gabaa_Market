import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerSnapshot {
  name: string;
  phone: string;
  email?: string;
  deliveryAddress: {
    city: string;
    subcityOrZone: string; // E.g., 'BOLE', 'KIRKOS'
    woreda?: string;
    houseNo?: string;
    landmark?: string;
    deliveryNotes?: string;
  };
}

export interface IOrder extends Document {
  orderNumber: string;
  trackingTokenHash: string; // SHA-256 hash of random tracking secret
  customerSnapshot: ICustomerSnapshot;
  itemsSubtotal: number; // in ETB cents
  deliveryTotal: number; // in ETB cents
  discountTotal: number; // in ETB cents
  grandTotal: number; // in ETB cents
  currency: string;
  orderStatus: "CONFIRMED" | "IN_FULFILLMENT" | "COMPLETED" | "CANCELLED";
  paymentMethod: "COD";
  paymentStatus: "PENDING" | "PARTIALLY_COLLECTED" | "COLLECTED";
  cancellationRequest?: {
    requested: boolean;
    requestedAt?: Date;
    reason?: string;
    status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    trackingTokenHash: { type: String, required: true, unique: true, index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      deliveryAddress: {
        city: { type: String, required: true },
        subcityOrZone: { type: String, required: true },
        woreda: { type: String },
        houseNo: { type: String },
        landmark: { type: String },
        deliveryNotes: { type: String },
      },
    },
    itemsSubtotal: { type: Number, required: true, min: 0 },
    deliveryTotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB" },
    orderStatus: {
      type: String,
      enum: ["CONFIRMED", "IN_FULFILLMENT", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
      index: true,
    },
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIALLY_COLLECTED", "COLLECTED"],
      default: "PENDING",
      index: true,
    },
    cancellationRequest: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date },
      reason: { type: String },
      status: {
        type: String,
        enum: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      reviewNotes: { type: String },
    },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReturnRefund extends Document {
  orderId: mongoose.Types.ObjectId;
  sellerOrderId: mongoose.Types.ObjectId;
  requestedBy: {
    customerName: string;
    customerPhone: string;
  };
  reason: string;
  evidenceImages?: string[];
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "EXECUTED";
  wasCodCollected: boolean; // Indicates if cash was actually collected prior to refund request
  responsibleParty?: "SELLER" | "PLATFORM";
  decisionBy?: mongoose.Types.ObjectId;
  decisionAt?: Date;
  refundAmount: number; // in ETB subunits (cents)
  refundMethod?: "CASH_RETURN" | "TELEBIRR" | "CBE_BIRR" | "BANK_TRANSFER";
  refundReference?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRefundSchema = new Schema<IReturnRefund>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    sellerOrderId: { type: Schema.Types.ObjectId, ref: "SellerOrder", required: true, index: true },
    requestedBy: {
      customerName: { type: String, required: true },
      customerPhone: { type: String, required: true },
    },
    reason: { type: String, required: true },
    evidenceImages: [{ type: String }],
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "EXECUTED"],
      default: "REQUESTED",
      index: true,
    },
    wasCodCollected: { type: Boolean, default: false },
    responsibleParty: { type: String, enum: ["SELLER", "PLATFORM"], default: "SELLER" },
    decisionBy: { type: Schema.Types.ObjectId, ref: "User" },
    decisionAt: { type: Date },
    refundAmount: { type: Number, required: true, min: 0 },
    refundMethod: {
      type: String,
      enum: ["CASH_RETURN", "TELEBIRR", "CBE_BIRR", "BANK_TRANSFER"],
    },
    refundReference: { type: String },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

export const ReturnRefund: Model<IReturnRefund> =
  mongoose.models.ReturnRefund || mongoose.model<IReturnRefund>("ReturnRefund", ReturnRefundSchema);

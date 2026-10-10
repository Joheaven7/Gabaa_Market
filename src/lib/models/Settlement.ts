import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettlement extends Document {
  sellerId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number; // In ETB subunits (cents)
  commissionDue: number; // Accrued during the period
  adjustments: number; // Refunds, reversals, or adjustments
  remittedAmount: number; // Paid by seller
  closingBalance: number; // Outstanding commission balance
  status: "DRAFT" | "PREPARED" | "APPROVED";
  preparedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    openingBalance: { type: Number, required: true },
    commissionDue: { type: Number, required: true, min: 0 },
    adjustments: { type: Number, default: 0 },
    remittedAmount: { type: Number, default: 0, min: 0 },
    closingBalance: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "PREPARED", "APPROVED"],
      default: "DRAFT",
      index: true,
    },
    preparedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

SettlementSchema.index({ sellerId: 1, periodEnd: -1 });

export const Settlement: Model<ISettlement> =
  mongoose.models.Settlement || mongoose.model<ISettlement>("Settlement", SettlementSchema);

import mongoose, { Schema, Document, Model } from "mongoose";

export type LedgerEntryType =
  | "COMMISSION_ACCRUED"
  | "COMMISSION_REVERSED"
  | "COD_COMMISSION_REMITTED"
  | "REFUND_ADJUSTMENT"
  | "CANCELLATION_ADJUSTMENT"
  | "ADMIN_ADJUSTMENT"
  | "SETTLEMENT_RECORDED";

export type LedgerDirection = "DEBIT" | "CREDIT";

export interface IFinancialLedgerEntry extends Document {
  sellerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  sellerOrderId?: mongoose.Types.ObjectId;
  entryType: LedgerEntryType;
  amount: number; // In ETB subunits (cents)
  currency: string;
  direction: LedgerDirection; // DEBIT increases commission owed, CREDIT decreases commission owed
  referenceId?: string; // e.g., bank slip reference, remittance ID, or orderNumber
  idempotencyKey: string; // Unique to avoid double-posting transactions
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const FinancialLedgerEntrySchema = new Schema<IFinancialLedgerEntry>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    sellerOrderId: { type: Schema.Types.ObjectId, ref: "SellerOrder", index: true },
    entryType: {
      type: String,
      enum: [
        "COMMISSION_ACCRUED",
        "COMMISSION_REVERSED",
        "COD_COMMISSION_REMITTED",
        "REFUND_ADJUSTMENT",
        "CANCELLATION_ADJUSTMENT",
        "ADMIN_ADJUSTMENT",
        "SETTLEMENT_RECORDED",
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB" },
    direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
    referenceId: { type: String, trim: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Immutable: no updatedAt
);

FinancialLedgerEntrySchema.index({ sellerId: 1, createdAt: -1 });

export const FinancialLedgerEntry: Model<IFinancialLedgerEntry> =
  mongoose.models.FinancialLedgerEntry ||
  mongoose.model<IFinancialLedgerEntry>("FinancialLedgerEntry", FinancialLedgerEntrySchema);

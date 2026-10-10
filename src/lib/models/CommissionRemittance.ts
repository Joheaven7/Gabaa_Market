import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommissionRemittance extends Document {
  sellerId: mongoose.Types.ObjectId;
  amount: number; // In ETB subunits (cents)
  currency: string;
  receivedAt: Date;
  method: "CBE_BIRR" | "TELEBIRR" | "AWASH_BANK" | "BANK_TRANSFER";
  reference: string; // Transaction reference or slip number
  recordedBy: mongoose.Types.ObjectId; // User who logged the remittance
  verifiedBy?: mongoose.Types.ObjectId; // Admin who approved the remittance
  verifiedAt?: Date;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRemittanceSchema = new Schema<ICommissionRemittance>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "ETB" },
    receivedAt: { type: Date, required: true },
    method: {
      type: String,
      enum: ["CBE_BIRR", "TELEBIRR", "AWASH_BANK", "BANK_TRANSFER"],
      required: true,
    },
    reference: { type: String, required: true, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"],
      default: "PENDING_VERIFICATION",
      index: true,
    },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

CommissionRemittanceSchema.index({ sellerId: 1, status: 1 });

export const CommissionRemittance: Model<ICommissionRemittance> =
  mongoose.models.CommissionRemittance ||
  mongoose.model<ICommissionRemittance>("CommissionRemittance", CommissionRemittanceSchema);

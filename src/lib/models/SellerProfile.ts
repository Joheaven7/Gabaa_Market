import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISellerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  slug: string;
  businessDetails: {
    tinNumber?: string;
    businessLicenseNo?: string;
    city: string;
    subcityOrZone: string;
    description?: string;
  };
  contactDetails: {
    contactPerson: string;
    phone: string;
    email: string;
    telegramUsername?: string;
    physicalAddress?: string;
  };
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
  applicationNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedAt?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SellerProfileSchema = new Schema<ISellerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    businessDetails: {
      tinNumber: { type: String, trim: true },
      businessLicenseNo: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      subcityOrZone: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
    },
    contactDetails: {
      contactPerson: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      telegramUsername: { type: String, trim: true },
      physicalAddress: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    applicationNotes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
  },
  { timestamps: true }
);

export const SellerProfile: Model<ISellerProfile> =
  mongoose.models.SellerProfile || mongoose.model<ISellerProfile>("SellerProfile", SellerProfileSchema);

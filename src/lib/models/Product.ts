import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductSnapshot {
  title: string;
  description: string;
  price: number; // In ETB subunits (cents)
  stockQuantity: number;
  sku: string;
  images: string[];
  variants?: Array<{
    name: string;
    options: string[];
    priceDelta?: number;
  }>;
  categoryId: mongoose.Types.ObjectId;
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  sku: string;
  price: number; // Current active price in ETB subunits
  stockQuantity: number;
  images: string[];
  variants?: Array<{
    name: string;
    options: string[];
    priceDelta?: number;
  }>;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  publishedVersion?: IProductSnapshot;
  pendingVersion?: IProductSnapshot;
  submittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSnapshotSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true },
    sku: { type: String, required: true },
    images: [{ type: String }],
    variants: [
      {
        name: { type: String },
        options: [{ type: String }],
        priceDelta: { type: Number, default: 0 },
      },
    ],
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // In ETB cents/subunits
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    variants: [
      {
        name: { type: String },
        options: [{ type: String }],
        priceDelta: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING_REVIEW",
      index: true,
    },
    publishedVersion: { type: ProductSnapshotSchema },
    pendingVersion: { type: ProductSnapshotSchema },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

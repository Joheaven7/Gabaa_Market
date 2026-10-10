import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItemSnapshot {
  productId: mongoose.Types.ObjectId;
  title: string;
  sku: string;
  price: number; // in ETB cents at checkout time
  quantity: number;
  subtotal: number; // in ETB cents = price * quantity
  image?: string;
  selectedVariant?: string;
}

export type FulfillmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PROCESSING"
  | "READY_TO_DISPATCH"
  | "SHIPPED"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

export type CodCollectionStatus =
  | "PENDING"
  | "COLLECTED"
  | "PARTIALLY_COLLECTED"
  | "NOT_COLLECTED"
  | "UNDER_REVIEW";

export type CommissionRemittanceStatus =
  | "NOT_DUE"
  | "DUE"
  | "PARTIALLY_REMITTED"
  | "REMITTED"
  | "OVERDUE"
  | "UNDER_REVIEW";

export interface ISellerOrder extends Document {
  orderId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  itemsSnapshot: IOrderItemSnapshot[];
  itemsSubtotal: number; // In ETB cents
  deliveryFee: number; // In ETB cents
  discountAllocation: number; // In ETB cents
  commissionRateSnapshot: number; // E.g., 0.10 (10%)
  commissionAmount: number; // In ETB cents (calculated only on itemsSubtotal)
  sellerNetAmount: number; // itemsSubtotal - commissionAmount + deliveryFee
  fulfillmentStatus: FulfillmentStatus;
  codCollectionStatus: CodCollectionStatus;
  codCollectedAmount?: number;
  codCollectedAt?: Date;
  codCollectionEvidence?: string;
  deliveryFailureReason?: string;
  commissionRemittanceStatus: CommissionRemittanceStatus;
  sellerFulfillmentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSnapshotSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String },
    selectedVariant: { type: String },
  },
  { _id: false }
);

const SellerOrderSchema = new Schema<ISellerOrder>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, index: true },
    itemsSnapshot: [OrderItemSnapshotSchema],
    itemsSubtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    discountAllocation: { type: Number, default: 0, min: 0 },
    commissionRateSnapshot: { type: Number, required: true, min: 0, max: 1 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerNetAmount: { type: Number, required: true, min: 0 },
    fulfillmentStatus: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "PROCESSING",
        "READY_TO_DISPATCH",
        "SHIPPED",
        "DELIVERED",
        "DELIVERY_FAILED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
      ],
      default: "PENDING",
      index: true,
    },
    codCollectionStatus: {
      type: String,
      enum: ["PENDING", "COLLECTED", "PARTIALLY_COLLECTED", "NOT_COLLECTED", "UNDER_REVIEW"],
      default: "PENDING",
      index: true,
    },
    codCollectedAmount: { type: Number, min: 0 },
    codCollectedAt: { type: Date },
    codCollectionEvidence: { type: String },
    deliveryFailureReason: { type: String },
    commissionRemittanceStatus: {
      type: String,
      enum: ["NOT_DUE", "DUE", "PARTIALLY_REMITTED", "REMITTED", "OVERDUE", "UNDER_REVIEW"],
      default: "NOT_DUE",
      index: true,
    },
    sellerFulfillmentNotes: { type: String },
  },
  { timestamps: true }
);

// Compound index for fast seller dashboard lookups
SellerOrderSchema.index({ sellerId: 1, fulfillmentStatus: 1, codCollectionStatus: 1 });

export const SellerOrder: Model<ISellerOrder> =
  mongoose.models.SellerOrder || mongoose.model<ISellerOrder>("SellerOrder", SellerOrderSchema);

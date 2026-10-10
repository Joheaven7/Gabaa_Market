import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAreaFeeOverride {
  areaCode: string;
  fee: number; // In ETB subunits
}

export interface ISellerDeliverySetting extends Document {
  sellerId: mongoose.Types.ObjectId;
  eligibleAreas: string[]; // List of area codes (e.g., 'BOLE', 'KIRKOS', 'HAWASSA')
  feeRules: {
    defaultFlatFee: number; // In ETB subunits (e.g., 15000 for 150.00 ETB)
    areaOverrides?: IAreaFeeOverride[];
    estimatedDeliveryDays: number;
  };
  freeDeliveryThreshold?: number; // In ETB subunits, if subtotal >= threshold, delivery is free
  active: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SellerDeliverySettingSchema = new Schema<ISellerDeliverySetting>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "SellerProfile", required: true, unique: true, index: true },
    eligibleAreas: [{ type: String, required: true }],
    feeRules: {
      defaultFlatFee: { type: Number, required: true, min: 0 },
      areaOverrides: [
        {
          areaCode: { type: String, required: true },
          fee: { type: Number, required: true, min: 0 },
        },
      ],
      estimatedDeliveryDays: { type: Number, default: 2, min: 1 },
    },
    freeDeliveryThreshold: { type: Number, min: 0 },
    active: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const SellerDeliverySetting: Model<ISellerDeliverySetting> =
  mongoose.models.SellerDeliverySetting ||
  mongoose.model<ISellerDeliverySetting>("SellerDeliverySetting", SellerDeliverySettingSchema);

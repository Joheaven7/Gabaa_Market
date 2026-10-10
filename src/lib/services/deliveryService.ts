import { SellerDeliverySetting } from "@/lib/models/SellerDeliverySetting";
import mongoose from "mongoose";

export interface DeliveryValidationResult {
  isServiceable: boolean;
  deliveryFee: number; // In ETB subunits (cents)
  estimatedDeliveryDays: number;
  reason?: string;
}

export async function getSellerDeliveryFee(
  sellerId: string | mongoose.Types.ObjectId,
  destinationAreaCode: string,
  itemsSubtotalSubunits: number
): Promise<DeliveryValidationResult> {
  const settings = await SellerDeliverySetting.findOne({
    sellerId: new mongoose.Types.ObjectId(sellerId.toString()),
    active: true,
  });

  // Default fallback if seller hasn't configured custom settings:
  // Flat 100 ETB for Addis Ababa subcities, not serviceable outside
  if (!settings) {
    return {
      isServiceable: true,
      deliveryFee: 10000, // 100.00 ETB
      estimatedDeliveryDays: 2,
    };
  }

  const isEligible = settings.eligibleAreas.includes(destinationAreaCode);
  if (!isEligible) {
    return {
      isServiceable: false,
      deliveryFee: 0,
      estimatedDeliveryDays: 0,
      reason: `Seller does not deliver to destination area (${destinationAreaCode}).`,
    };
  }

  // Check free delivery threshold
  if (
    settings.freeDeliveryThreshold &&
    settings.freeDeliveryThreshold > 0 &&
    itemsSubtotalSubunits >= settings.freeDeliveryThreshold
  ) {
    return {
      isServiceable: true,
      deliveryFee: 0,
      estimatedDeliveryDays: settings.feeRules.estimatedDeliveryDays || 2,
    };
  }

  // Check area specific override
  const override = settings.feeRules.areaOverrides?.find(
    (o) => o.areaCode === destinationAreaCode
  );
  const fee = override ? override.fee : settings.feeRules.defaultFlatFee;

  return {
    isServiceable: true,
    deliveryFee: fee,
    estimatedDeliveryDays: settings.feeRules.estimatedDeliveryDays || 2,
  };
}

import { Order, IOrder, ICustomerSnapshot } from "@/lib/models/Order";
import { SellerOrder, ISellerOrder, IOrderItemSnapshot } from "@/lib/models/SellerOrder";
import { Product } from "@/lib/models/Product";
import { SellerProfile } from "@/lib/models/SellerProfile";
import { NotificationJob } from "@/lib/models/NotificationJob";
import { getSellerDeliveryFee } from "./deliveryService";
import { logAudit } from "./auditService";
import { generateOrderNumber, generateTrackingToken, hashTrackingToken } from "@/lib/utils/tokens";
import { calculateCommissionSubunits } from "@/lib/utils/currency";
import { MARKETPLACE_CONFIG } from "@/config/marketplacePolicies";
import mongoose from "mongoose";

export interface CheckoutCartItem {
  productId: string;
  quantity: number;
  selectedVariant?: string;
}

export interface CheckoutPayload {
  customer: ICustomerSnapshot;
  items: CheckoutCartItem[];
  idempotencyKey?: string;
}

export interface CheckoutResult {
  success: boolean;
  orderNumber?: string;
  trackingToken?: string;
  grandTotal?: number;
  error?: string;
  itemErrors?: string[];
}

export async function processGuestCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const { customer, items } = payload;

  if (!items || items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  // 1. Fetch all products from DB and ensure active seller
  const productIds = items.map((i) => new mongoose.Types.ObjectId(i.productId));
  const products = await Product.find({
    _id: { $in: productIds },
    isDeleted: false,
  }).populate<{ sellerId: { _id: mongoose.Types.ObjectId; status: string; storeName: string } }>(
    "sellerId"
  );

  const productMap = new Map<string, (typeof products)[0]>();
  for (const p of products) {
    productMap.set(p._id.toString(), p);
  }

  // 2. Validate availability, seller status, and inventory
  const validationErrors: string[] = [];
  const sellerBuckets = new Map<
    string,
    {
      sellerId: string;
      storeName: string;
      items: Array<{
        product: (typeof products)[0];
        quantity: number;
        subtotal: number;
        selectedVariant?: string;
      }>;
      itemsSubtotal: number;
    }
  >();

  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) {
      validationErrors.push(`Product not found (ID: ${item.productId})`);
      continue;
    }

    if (prod.status !== "APPROVED") {
      validationErrors.push(`"${prod.title}" is currently not available for purchase.`);
      continue;
    }

    const seller = prod.sellerId as any;
    if (!seller || seller.status !== "APPROVED") {
      validationErrors.push(
        `Seller for "${prod.title}" is currently unavailable or awaiting review.`
      );
      continue;
    }

    if (prod.stockQuantity < item.quantity) {
      validationErrors.push(
        `Insufficient stock for "${prod.title}". Requested: ${item.quantity}, Available: ${prod.stockQuantity}`
      );
      continue;
    }

    const sellerKey = seller._id.toString();
    const lineSubtotal = prod.price * item.quantity;

    if (!sellerBuckets.has(sellerKey)) {
      sellerBuckets.set(sellerKey, {
        sellerId: sellerKey,
        storeName: seller.storeName,
        items: [],
        itemsSubtotal: 0,
      });
    }

    const bucket = sellerBuckets.get(sellerKey)!;
    bucket.items.push({
      product: prod,
      quantity: item.quantity,
      subtotal: lineSubtotal,
      selectedVariant: item.selectedVariant,
    });
    bucket.itemsSubtotal += lineSubtotal;
  }

  if (validationErrors.length > 0) {
    return {
      success: false,
      error: "Order validation failed. Please review errors.",
      itemErrors: validationErrors,
    };
  }

  // 3. Validate delivery coverage & compute delivery fees per seller
  const destinationArea = customer.deliveryAddress.subcityOrZone;
  const sellerOrdersData: Array<{
    sellerId: string;
    itemsSnapshot: IOrderItemSnapshot[];
    itemsSubtotal: number;
    deliveryFee: number;
    commissionRateSnapshot: number;
    commissionAmount: number;
    sellerNetAmount: number;
  }> = [];

  let grandItemsSubtotal = 0;
  let grandDeliveryTotal = 0;

  for (const [sellerId, bucket] of sellerBuckets.entries()) {
    const deliveryCheck = await getSellerDeliveryFee(
      sellerId,
      destinationArea,
      bucket.itemsSubtotal
    );

    if (!deliveryCheck.isServiceable) {
      return {
        success: false,
        error: `Seller "${bucket.storeName}" does not deliver to ${destinationArea}.`,
        itemErrors: [deliveryCheck.reason || "Delivery address outside seller coverage."],
      };
    }

    const commissionRate = MARKETPLACE_CONFIG.defaultCommissionRate;
    const commissionAmount = calculateCommissionSubunits(bucket.itemsSubtotal, commissionRate);
    const sellerNetAmount = bucket.itemsSubtotal - commissionAmount + deliveryCheck.deliveryFee;

    const itemsSnapshot: IOrderItemSnapshot[] = bucket.items.map((i) => ({
      productId: i.product._id,
      title: i.product.title,
      sku: i.product.sku,
      price: i.product.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
      image: i.product.images?.[0] || "",
      selectedVariant: i.selectedVariant,
    }));

    sellerOrdersData.push({
      sellerId,
      itemsSnapshot,
      itemsSubtotal: bucket.itemsSubtotal,
      deliveryFee: deliveryCheck.deliveryFee,
      commissionRateSnapshot: commissionRate,
      commissionAmount,
      sellerNetAmount,
    });

    grandItemsSubtotal += bucket.itemsSubtotal;
    grandDeliveryTotal += deliveryCheck.deliveryFee;
  }

  const grandTotal = grandItemsSubtotal + grandDeliveryTotal;

  // 4. Generate Order Credentials
  const orderNumber = generateOrderNumber();
  const rawTrackingToken = generateTrackingToken(32);
  const trackingTokenHash = hashTrackingToken(rawTrackingToken);

  // 5. Create Parent Order
  const parentOrder = await Order.create({
    orderNumber,
    trackingTokenHash,
    customerSnapshot: customer,
    itemsSubtotal: grandItemsSubtotal,
    deliveryTotal: grandDeliveryTotal,
    discountTotal: 0,
    grandTotal,
    currency: "ETB",
    orderStatus: "CONFIRMED",
    paymentMethod: "COD",
    paymentStatus: "PENDING",
  });

  // 6. Create SellerOrders
  const createdSellerOrders = [];
  for (const sData of sellerOrdersData) {
    const sOrder = await SellerOrder.create({
      orderId: parentOrder._id,
      sellerId: new mongoose.Types.ObjectId(sData.sellerId),
      itemsSnapshot: sData.itemsSnapshot,
      itemsSubtotal: sData.itemsSubtotal,
      deliveryFee: sData.deliveryFee,
      discountAllocation: 0,
      commissionRateSnapshot: sData.commissionRateSnapshot,
      commissionAmount: sData.commissionAmount,
      sellerNetAmount: sData.sellerNetAmount,
      fulfillmentStatus: "PENDING",
      codCollectionStatus: "PENDING",
      commissionRemittanceStatus: "NOT_DUE",
    });
    createdSellerOrders.push(sOrder);
  }

  // 7. Atomically Decrement Inventory
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } }
    );
  }

  // 8. Queue Notification Job
  await NotificationJob.create({
    eventType: "ORDER_CONFIRMED",
    entityId: parentOrder._id.toString(),
    recipient: customer.phone,
    channel: "SMS",
    payload: {
      orderNumber,
      grandTotal,
      subcity: destinationArea,
      sellerCount: sellerOrdersData.length,
    },
    status: "PENDING",
  });

  // 9. Log Audit Entry
  await logAudit({
    action: "ORDER_CREATED",
    entityType: "Order",
    entityId: parentOrder._id.toString(),
    afterSummary: `Order ${orderNumber} created with ${sellerOrdersData.length} seller orders. Grand total: ${grandTotal / 100} ETB`,
    metadata: {
      orderNumber,
      sellerCount: sellerOrdersData.length,
      customerPhone: customer.phone,
    },
  });

  return {
    success: true,
    orderNumber,
    trackingToken: rawTrackingToken,
    grandTotal,
  };
}

export async function getOrderByTrackingToken(rawToken: string) {
  if (!rawToken || rawToken.trim().length === 0) {
    return null;
  }

  const tokenHash = hashTrackingToken(rawToken.trim());
  const order = await Order.findOne({ trackingTokenHash: tokenHash });
  if (!order) {
    return null;
  }

  const sellerOrders = await SellerOrder.find({ orderId: order._id }).populate<{
    sellerId: { storeName: string; contactDetails: { phone: string } };
  }>("sellerId", "storeName contactDetails.phone");

  // Minimal PII leakage: mask customer phone
  const maskedPhone =
    order.customerSnapshot.phone.slice(0, 4) +
    "****" +
    order.customerSnapshot.phone.slice(-3);

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customerSummary: {
      name: order.customerSnapshot.name,
      maskedPhone,
      city: order.customerSnapshot.deliveryAddress.city,
      subcity: order.customerSnapshot.deliveryAddress.subcityOrZone,
    },
    totals: {
      itemsSubtotal: order.itemsSubtotal,
      deliveryTotal: order.deliveryTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
    },
    cancellationRequest: order.cancellationRequest,
    sellerOrders: sellerOrders.map((so) => ({
      sellerOrderId: so._id.toString(),
      storeName: (so.sellerId as any)?.storeName || "Marketplace Seller",
      items: so.itemsSnapshot,
      itemsSubtotal: so.itemsSubtotal,
      deliveryFee: so.deliveryFee,
      fulfillmentStatus: so.fulfillmentStatus,
      codCollectionStatus: so.codCollectionStatus,
      deliveryFailureReason: so.deliveryFailureReason,
    })),
  };
}

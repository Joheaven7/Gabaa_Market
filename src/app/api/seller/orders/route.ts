import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { SellerOrder, FulfillmentStatus, CodCollectionStatus } from "@/lib/models/SellerOrder";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { postLedgerEntry } from "@/lib/services/ledgerService";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SELLER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (!session.sellerId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const sellerId =
      session.role === "ADMIN" && searchParams.get("sellerId")
        ? searchParams.get("sellerId")!
        : session.sellerId!;

    const fulfillmentStatus = searchParams.get("fulfillmentStatus");
    const codStatus = searchParams.get("codStatus");

    const query: any = { sellerId: new mongoose.Types.ObjectId(sellerId) };
    if (fulfillmentStatus) query.fulfillmentStatus = fulfillmentStatus;
    if (codStatus) query.codCollectionStatus = codStatus;

    const orders = await SellerOrder.find(query)
      .populate("orderId", "orderNumber customerSnapshot orderStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Seller orders GET error:", error);
    return NextResponse.json({ error: "Failed to load seller orders." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SELLER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { sellerOrderId, action, fulfillmentStatus, codData, failureReason, sellerNotes } = body;

    if (!sellerOrderId) {
      return NextResponse.json({ error: "Seller order ID is required." }, { status: 400 });
    }

    const sellerOrder = await SellerOrder.findById(sellerOrderId);
    if (!sellerOrder) {
      return NextResponse.json({ error: "Seller order not found." }, { status: 404 });
    }

    // Verify ownership: seller can only update their own order
    if (session.role === "SELLER" && sellerOrder.sellerId.toString() !== session.sellerId) {
      return NextResponse.json({ error: "Access denied to this order." }, { status: 403 });
    }

    // Action 1: Update fulfillment status
    if (action === "UPDATE_FULFILLMENT") {
      const oldStatus = sellerOrder.fulfillmentStatus;
      sellerOrder.fulfillmentStatus = fulfillmentStatus as FulfillmentStatus;

      if (fulfillmentStatus === "DELIVERY_FAILED") {
        sellerOrder.deliveryFailureReason = failureReason || "Customer unreachable or refused";
        sellerOrder.codCollectionStatus = "NOT_COLLECTED";

        // Return stock for failed delivery
        for (const item of sellerOrder.itemsSnapshot) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: item.quantity } }
          );
        }
      }

      if (sellerNotes) {
        sellerOrder.sellerFulfillmentNotes = sellerNotes;
      }

      await sellerOrder.save();

      await logAudit({
        actorId: session.userId,
        actorRole: session.role,
        action: "SELLER_ORDER_STATUS_UPDATED",
        entityType: "SellerOrder",
        entityId: sellerOrder._id.toString(),
        beforeSummary: `Fulfillment status: ${oldStatus}`,
        afterSummary: `Fulfillment status: ${fulfillmentStatus}`,
        metadata: { sellerOrderId, fulfillmentStatus, failureReason },
      });

      return NextResponse.json({ success: true, sellerOrder });
    }

    // Action 2: Record COD Cash Collection
    // RULE: marking delivered does NOT automatically mark paid. Must record collection separately.
    if (action === "RECORD_COD_COLLECTION") {
      const { collectedAmount, evidence, collectionDate } = codData || {};

      if (!collectedAmount || collectedAmount <= 0) {
        return NextResponse.json(
          { error: "Valid collected cash amount is required." },
          { status: 400 }
        );
      }

      sellerOrder.codCollectionStatus = "COLLECTED";
      sellerOrder.codCollectedAmount = collectedAmount;
      sellerOrder.codCollectedAt = collectionDate ? new Date(collectionDate) : new Date();
      sellerOrder.codCollectionEvidence = evidence || "Seller cash acknowledgment";
      sellerOrder.commissionRemittanceStatus = "DUE";
      await sellerOrder.save();

      // Post immutable ledger entry: COMMISSION_ACCRUED
      const idempotencyKey = `comm_accrued_${sellerOrder._id.toString()}`;
      await postLedgerEntry({
        sellerId: sellerOrder.sellerId,
        orderId: sellerOrder.orderId,
        sellerOrderId: sellerOrder._id,
        entryType: "COMMISSION_ACCRUED",
        amount: sellerOrder.commissionAmount,
        direction: "DEBIT", // DEBIT = seller owes commission to platform
        referenceId: `ORDER-${sellerOrder._id.toString().slice(-6)}`,
        idempotencyKey,
        createdBy: session.userId,
        notes: `10% Commission accrued upon confirmed cash collection (${collectedAmount / 100} ETB collected).`,
      });

      // Update parent order paymentStatus if applicable
      const allSiblings = await SellerOrder.find({ orderId: sellerOrder.orderId });
      const allCollected = allSiblings.every((s) => s.codCollectionStatus === "COLLECTED");
      const someCollected = allSiblings.some((s) => s.codCollectionStatus === "COLLECTED");

      await Order.findByIdAndUpdate(sellerOrder.orderId, {
        paymentStatus: allCollected ? "COLLECTED" : someCollected ? "PARTIALLY_COLLECTED" : "PENDING",
      });

      await logAudit({
        actorId: session.userId,
        actorRole: session.role,
        action: "COD_COLLECTION_RECORDED",
        entityType: "SellerOrder",
        entityId: sellerOrder._id.toString(),
        afterSummary: `Cash collected: ${collectedAmount / 100} ETB. Commission obligation accrued: ${sellerOrder.commissionAmount / 100} ETB`,
        metadata: { collectedAmount, evidence },
      });

      return NextResponse.json({ success: true, sellerOrder });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Seller orders PATCH error:", error);
    return NextResponse.json({ error: "Failed to update seller order." }, { status: 500 });
  }
}

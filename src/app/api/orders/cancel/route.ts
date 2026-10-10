import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Order } from "@/lib/models/Order";
import { SellerOrder } from "@/lib/models/SellerOrder";
import { Product } from "@/lib/models/Product";
import { hashTrackingToken } from "@/lib/utils/tokens";
import { logAudit } from "@/lib/services/auditService";
import { MARKETPLACE_CONFIG } from "@/config/marketplacePolicies";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { token, reason } = body;

    if (!token || !reason) {
      return NextResponse.json(
        { error: "Tracking token and cancellation reason are required." },
        { status: 400 }
      );
    }

    const tokenHash = hashTrackingToken(token.trim());
    const order = await Order.findOne({ trackingTokenHash: tokenHash });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.orderStatus === "CANCELLED") {
      return NextResponse.json({ error: "Order is already cancelled." }, { status: 400 });
    }

    const sellerOrders = await SellerOrder.find({ orderId: order._id });

    // Check if any seller has already shipped or delivered
    const hasDispatchedSellers = sellerOrders.some((so) =>
      ["PROCESSING", "READY_TO_DISPATCH", "SHIPPED", "DELIVERED"].includes(so.fulfillmentStatus)
    );

    if (hasDispatchedSellers) {
      // Escalates to Admin Exception Queue
      order.cancellationRequest = {
        requested: true,
        requestedAt: new Date(),
        reason: reason.trim(),
        status: "PENDING_REVIEW",
      };
      await order.save();

      await logAudit({
        action: "ORDER_CANCELLATION_ESCALATED",
        entityType: "Order",
        entityId: order._id.toString(),
        afterSummary: `Order ${order.orderNumber} cancellation requested while fulfillment in progress. Escalated to admin review. Reason: ${reason}`,
      });

      return NextResponse.json({
        success: true,
        escalated: true,
        message:
          "Your cancellation request has been submitted for marketplace admin review because items are already being processed or prepared for dispatch.",
      });
    }

    // Auto-cancellation eligible: all seller orders are PENDING or ACCEPTED
    order.orderStatus = "CANCELLED";
    order.cancellationRequest = {
      requested: true,
      requestedAt: new Date(),
      reason: reason.trim(),
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewNotes: "Auto-approved: order had not commenced dispatch processing.",
    };
    await order.save();

    for (const so of sellerOrders) {
      so.fulfillmentStatus = "CANCELLED";
      so.codCollectionStatus = "NOT_COLLECTED";
      await so.save();

      // Restore inventory
      for (const item of so.itemsSnapshot) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } }
        );
      }
    }

    await logAudit({
      action: "ORDER_AUTO_CANCELLED",
      entityType: "Order",
      entityId: order._id.toString(),
      afterSummary: `Order ${order.orderNumber} auto-cancelled upon customer request. Inventory restored.`,
    });

    return NextResponse.json({
      success: true,
      escalated: false,
      message: "Order has been successfully cancelled. No payment was collected.",
    });
  } catch (error: any) {
    console.error("Cancellation API error:", error);
    return NextResponse.json({ error: "Failed to process cancellation request." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { SellerProfile } from "@/lib/models/SellerProfile";
import { User } from "@/lib/models/User";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status) query.status = status;

    const sellers = await SellerProfile.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, sellers });
  } catch (error: any) {
    console.error("Admin sellers GET error:", error);
    return NextResponse.json({ error: "Failed to load sellers." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { sellerId, action, reason } = body;

    if (!sellerId || !action) {
      return NextResponse.json({ error: "Seller ID and action are required." }, { status: 400 });
    }

    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const oldStatus = seller.status;

    if (action === "APPROVE") {
      seller.status = "APPROVED";
      seller.approvedBy = new mongoose.Types.ObjectId(session.userId);
      seller.approvedAt = new Date();
      await seller.save();

      // Ensure user has SELLER role
      await User.findByIdAndUpdate(seller.userId, { role: "SELLER" });

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "SELLER_APPROVED",
        entityType: "SellerProfile",
        entityId: seller._id.toString(),
        beforeSummary: `Status: ${oldStatus}`,
        afterSummary: `Status: APPROVED`,
      });

      return NextResponse.json({ success: true, message: `Store "${seller.storeName}" approved.`, seller });
    } else if (action === "REJECT") {
      seller.status = "REJECTED";
      seller.rejectedAt = new Date();
      seller.applicationNotes = reason || "Application rejected by marketplace administration.";
      await seller.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "SELLER_REJECTED",
        entityType: "SellerProfile",
        entityId: seller._id.toString(),
        beforeSummary: `Status: ${oldStatus}`,
        afterSummary: `Status: REJECTED`,
        metadata: { reason },
      });

      return NextResponse.json({ success: true, message: `Store "${seller.storeName}" application rejected.`, seller });
    } else if (action === "SUSPEND") {
      // Suspension rule: Prevents new sales immediately, but retains orders and ledger obligations
      seller.status = "SUSPENDED";
      seller.suspendedAt = new Date();
      seller.suspensionReason = reason || "Suspended by admin review";
      await seller.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "SELLER_SUSPENDED",
        entityType: "SellerProfile",
        entityId: seller._id.toString(),
        beforeSummary: `Status: ${oldStatus}`,
        afterSummary: `Status: SUSPENDED. Reason: ${seller.suspensionReason}`,
      });

      return NextResponse.json({
        success: true,
        message: `Store "${seller.storeName}" has been suspended. Live listings disabled.`,
        seller,
      });
    } else if (action === "REINSTATE") {
      seller.status = "APPROVED";
      seller.suspensionReason = undefined;
      seller.suspendedAt = undefined;
      await seller.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "SELLER_REINSTATED",
        entityType: "SellerProfile",
        entityId: seller._id.toString(),
        beforeSummary: `Status: SUSPENDED`,
        afterSummary: `Status: APPROVED (Reinstated)`,
      });

      return NextResponse.json({ success: true, message: `Store "${seller.storeName}" reinstated.`, seller });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin sellers PATCH error:", error);
    return NextResponse.json({ error: "Failed to update seller." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { Settlement } from "@/lib/models/Settlement";
import { getSellerLedgerBalance, postLedgerEntry } from "@/lib/services/ledgerService";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const settlements = await Settlement.find()
      .populate("sellerId", "storeName contactDetails")
      .populate("preparedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, settlements });
  } catch (error: any) {
    console.error("Settlements GET error:", error);
    return NextResponse.json({ error: "Failed to load settlements." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { settlementId, sellerId, periodStart, periodEnd, action, notes } = body;

    // Action 1: Approve existing prepared settlement
    if (action === "APPROVE" && settlementId) {
      const settlement = await Settlement.findById(settlementId);
      if (!settlement) {
        return NextResponse.json({ error: "Settlement statement not found." }, { status: 404 });
      }

      settlement.status = "APPROVED";
      settlement.approvedBy = new mongoose.Types.ObjectId(session.userId);
      settlement.approvedAt = new Date();
      if (notes) settlement.notes = notes;
      await settlement.save();

      // Post immutable ledger record
      await postLedgerEntry({
        sellerId: settlement.sellerId,
        entryType: "SETTLEMENT_RECORDED",
        amount: settlement.closingBalance,
        direction: "DEBIT",
        referenceId: `SETTLE-${settlement._id.toString().slice(-6)}`,
        idempotencyKey: `settle_approved_${settlement._id.toString()}`,
        createdBy: session.userId,
        notes: `Settlement approved for period ending ${settlement.periodEnd.toISOString().split("T")[0]}. Closing balance: ${settlement.closingBalance / 100} ETB`,
      });

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "SETTLEMENT_APPROVED",
        entityType: "Settlement",
        entityId: settlement._id.toString(),
        afterSummary: `Settlement approved for seller. Closing balance: ${settlement.closingBalance / 100} ETB. PreparedBy: ${settlement.preparedBy}, ApprovedBy: ${session.userId}`,
      });

      return NextResponse.json({ success: true, message: "Settlement statement approved.", settlement });
    }

    // Action 2: Prepare new settlement
    if (!sellerId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Seller ID, period start, and period end dates are required." },
        { status: 400 }
      );
    }

    const sId = new mongoose.Types.ObjectId(sellerId);
    const balanceData = await getSellerLedgerBalance(sId);

    const settlement = await Settlement.create({
      sellerId: sId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      openingBalance: 0,
      commissionDue: balanceData.totalAccruedCommission,
      adjustments: balanceData.totalAdjustments,
      remittedAmount: balanceData.totalRemittedCommission,
      closingBalance: balanceData.outstandingBalance,
      status: "PREPARED",
      preparedBy: new mongoose.Types.ObjectId(session.userId),
      notes: notes || "Periodic commission reconciliation statement",
    });

    await logAudit({
      actorId: session.userId,
      actorRole: "ADMIN",
      action: "SETTLEMENT_PREPARED",
      entityType: "Settlement",
      entityId: settlement._id.toString(),
      afterSummary: `Settlement prepared for seller. Outstanding balance: ${balanceData.outstandingBalance / 100} ETB`,
    });

    return NextResponse.json({
      success: true,
      message: "Settlement prepared successfully. Ready for approval.",
      settlement,
    });
  } catch (error: any) {
    console.error("Settlements POST error:", error);
    return NextResponse.json({ error: "Failed to generate settlement." }, { status: 500 });
  }
}

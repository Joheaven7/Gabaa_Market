import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { CommissionRemittance } from "@/lib/models/CommissionRemittance";
import { postLedgerEntry } from "@/lib/services/ledgerService";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const remittances = await CommissionRemittance.find()
      .populate("sellerId", "storeName contactDetails")
      .populate("recordedBy", "name email")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, remittances });
  } catch (error: any) {
    console.error("Admin remittances GET error:", error);
    return NextResponse.json({ error: "Failed to load remittances." }, { status: 500 });
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
    const { remittanceId, action, reason } = body;

    if (!remittanceId || !action) {
      return NextResponse.json({ error: "Remittance ID and action are required." }, { status: 400 });
    }

    const remittance = await CommissionRemittance.findById(remittanceId);
    if (!remittance) {
      return NextResponse.json({ error: "Remittance not found." }, { status: 404 });
    }

    if (remittance.status === "VERIFIED") {
      return NextResponse.json({ error: "Remittance has already been verified." }, { status: 400 });
    }

    if (action === "VERIFY") {
      remittance.status = "VERIFIED";
      remittance.verifiedBy = new mongoose.Types.ObjectId(session.userId);
      remittance.verifiedAt = new Date();
      await remittance.save();

      // Post immutable ledger entry: COD_COMMISSION_REMITTED
      const idempotencyKey = `remit_verify_${remittance._id.toString()}`;
      await postLedgerEntry({
        sellerId: remittance.sellerId,
        entryType: "COD_COMMISSION_REMITTED",
        amount: remittance.amount,
        direction: "CREDIT", // CREDIT = reduces commission owed to marketplace
        referenceId: remittance.reference,
        idempotencyKey,
        createdBy: session.userId,
        notes: `Verified remittance received via ${remittance.method} (Ref: ${remittance.reference})`,
      });

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "COMMISSION_REMITTANCE_VERIFIED",
        entityType: "CommissionRemittance",
        entityId: remittance._id.toString(),
        afterSummary: `Verified ${remittance.amount / 100} ETB remittance (Ref: ${remittance.reference}). Posted to ledger.`,
      });

      return NextResponse.json({ success: true, message: "Remittance verified and credited to ledger.", remittance });
    } else if (action === "REJECT") {
      remittance.status = "REJECTED";
      remittance.verifiedBy = new mongoose.Types.ObjectId(session.userId);
      remittance.verifiedAt = new Date();
      remittance.rejectionReason = reason || "Payment could not be verified on bank slip.";
      await remittance.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "COMMISSION_REMITTANCE_REJECTED",
        entityType: "CommissionRemittance",
        entityId: remittance._id.toString(),
        afterSummary: `Rejected remittance ${remittance.amount / 100} ETB. Reason: ${remittance.rejectionReason}`,
      });

      return NextResponse.json({ success: true, message: "Remittance marked rejected.", remittance });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin remittances PATCH error:", error);
    return NextResponse.json({ error: "Failed to update remittance." }, { status: 500 });
  }
}

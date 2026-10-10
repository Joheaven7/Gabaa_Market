import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { CommissionRemittance } from "@/lib/models/CommissionRemittance";
import { FinancialLedgerEntry } from "@/lib/models/FinancialLedgerEntry";
import { getSellerLedgerBalance } from "@/lib/services/ledgerService";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SELLER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const sellerId =
      session.role === "ADMIN" && searchParams.get("sellerId")
        ? searchParams.get("sellerId")!
        : session.sellerId!;

    const sId = new mongoose.Types.ObjectId(sellerId);

    const balance = await getSellerLedgerBalance(sId);
    const remittances = await CommissionRemittance.find({ sellerId: sId })
      .sort({ createdAt: -1 })
      .lean();
    const ledgerEntries = await FinancialLedgerEntry.find({ sellerId: sId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      balance,
      remittances,
      ledgerEntries,
    });
  } catch (error: any) {
    console.error("Seller remittances GET error:", error);
    return NextResponse.json({ error: "Failed to load financial records." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SELLER" || !session.sellerId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { amount, method, reference, notes } = body;

    if (!amount || amount <= 0 || !method || !reference) {
      return NextResponse.json(
        { error: "Amount, payment method, and transaction reference are required." },
        { status: 400 }
      );
    }

    const remittance = await CommissionRemittance.create({
      sellerId: new mongoose.Types.ObjectId(session.sellerId),
      amount: Math.round(Number(amount)), // In ETB subunits
      currency: "ETB",
      receivedAt: new Date(),
      method,
      reference: reference.trim(),
      recordedBy: new mongoose.Types.ObjectId(session.userId),
      status: "PENDING_VERIFICATION",
      notes: notes?.trim(),
    });

    await logAudit({
      actorId: session.userId,
      actorRole: "SELLER",
      action: "COMMISSION_REMITTANCE_SUBMITTED",
      entityType: "CommissionRemittance",
      entityId: remittance._id.toString(),
      afterSummary: `Submitted ${amount / 100} ETB remittance via ${method} (Ref: ${reference})`,
      metadata: { amount, method, reference },
    });

    return NextResponse.json({
      success: true,
      message: "Remittance submitted successfully for admin verification.",
      remittance,
    });
  } catch (error: any) {
    console.error("Seller remittances POST error:", error);
    return NextResponse.json({ error: "Failed to record remittance." }, { status: 500 });
  }
}

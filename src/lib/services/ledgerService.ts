import {
  FinancialLedgerEntry,
  LedryEntryType,
  LedgerDirection,
  IFinancialLedgerEntry,
} from "@/lib/models/FinancialLedgerEntry";
import mongoose from "mongoose";

export interface PostLedgerEntryOptions {
  sellerId: string | mongoose.Types.ObjectId;
  orderId?: string | mongoose.Types.ObjectId;
  sellerOrderId?: string | mongoose.Types.ObjectId;
  entryType:
    | "COMMISSION_ACCRUED"
    | "COMMISSION_REVERSED"
    | "COD_COMMISSION_REMITTED"
    | "REFUND_ADJUSTMENT"
    | "CANCELLATION_ADJUSTMENT"
    | "ADMIN_ADJUSTMENT"
    | "SETTLEMENT_RECORDED";
  amount: number; // In ETB subunits (cents)
  direction: "DEBIT" | "CREDIT"; // DEBIT = Commission owed to platform; CREDIT = Remitted/Reversed
  referenceId?: string;
  idempotencyKey: string;
  createdBy?: string | mongoose.Types.ObjectId;
  notes?: string;
}

export async function postLedgerEntry(
  options: PostLedgerEntryOptions
): Promise<IFinancialLedgerEntry> {
  // Check if idempotencyKey already exists to prevent duplicate posting
  const existing = await FinancialLedgerEntry.findOne({
    idempotencyKey: options.idempotencyKey,
  });
  if (existing) {
    return existing;
  }

  const entry = await FinancialLedgerEntry.create({
    sellerId: new mongoose.Types.ObjectId(options.sellerId.toString()),
    orderId: options.orderId ? new mongoose.Types.ObjectId(options.orderId.toString()) : undefined,
    sellerOrderId: options.sellerOrderId
      ? new mongoose.Types.ObjectId(options.sellerOrderId.toString())
      : undefined,
    entryType: options.entryType,
    amount: options.amount,
    currency: "ETB",
    direction: options.direction,
    referenceId: options.referenceId,
    idempotencyKey: options.idempotencyKey,
    createdBy: options.createdBy
      ? new mongoose.Types.ObjectId(options.createdBy.toString())
      : undefined,
    notes: options.notes,
  });

  return entry;
}

/**
 * Calculates current commission balance directly from immutable ledger entries:
 * Balance = Total DEBITS (commissions accrued) - Total CREDITS (verified remittances & reversals)
 * Positive balance means seller currently owes commission to the platform.
 */
export async function getSellerLedgerBalance(
  sellerId: string | mongoose.Types.ObjectId
): Promise<{
  totalAccruedCommission: number; // in cents
  totalRemittedCommission: number; // in cents
  totalAdjustments: number; // in cents
  outstandingBalance: number; // in cents
}> {
  const sId = new mongoose.Types.ObjectId(sellerId.toString());

  const entries = await FinancialLedgerEntry.find({ sellerId: sId });

  let totalAccrued = 0;
  let totalRemitted = 0;
  let totalAdjustments = 0;

  for (const entry of entries) {
    if (entry.entryType === "COMMISSION_ACCRUED") {
      totalAccrued += entry.amount;
    } else if (entry.entryType === "COD_COMMISSION_REMITTED") {
      totalRemitted += entry.amount;
    } else if (
      entry.entryType === "COMMISSION_REVERSED" ||
      entry.entryType === "CANCELLATION_ADJUSTMENT" ||
      entry.entryType === "REFUND_ADJUSTMENT"
    ) {
      if (entry.direction === "CREDIT") {
        totalAdjustments += entry.amount;
      } else {
        totalAdjustments -= entry.amount;
      }
    } else if (entry.entryType === "ADMIN_ADJUSTMENT") {
      if (entry.direction === "CREDIT") {
        totalAdjustments += entry.amount;
      } else {
        totalAdjustments -= entry.amount;
      }
    }
  }

  const outstandingBalance = totalAccrued - totalRemitted - totalAdjustments;

  return {
    totalAccruedCommission: totalAccrued,
    totalRemittedCommission: totalRemitted,
    totalAdjustments,
    outstandingBalance: Math.max(0, outstandingBalance),
  };
}

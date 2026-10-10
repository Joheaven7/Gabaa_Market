# ZEMEN MARKET (ዘመን ገበያ) — Official Business Policies & Operational Manual

This document serves as the binding operational and technical baseline for ZEMEN MARKET MVP.

---

## 1. Cash-On-Delivery (COD) Collection Policy

1. **Independent Seller Collection**:
   - Each seller fulfills their own `SellerOrder` portion and collects cash directly from the buyer at the point of delivery.
   - ZEMEN MARKET does not hold COD buyer funds in escrow during the MVP phase.
2. **Decoupling of Delivery and Payment**:
   - `fulfillmentStatus` and `codCollectionStatus` are tracked as separate, independent state machines.
   - Marking a shipment as `DELIVERED` **NEVER** automatically transitions `codCollectionStatus` to `COLLECTED`.
   - A dedicated collection action must be logged by the seller, capturing:
     - `codCollectedAmount` (in ETB cents/santim)
     - `codCollectedAt` (timestamp)
     - `evidenceNote` (e.g., physical receipt number, customer acknowledgment)
3. **Failed Delivery Handling**:
   - If delivery fails (`DELIVERY_FAILED`), `codCollectionStatus` is marked `NOT_COLLECTED`.
   - No commission obligation is accrued for uncollected orders.
   - Returned inventory is safely incremented back to active stock.

---

## 2. Commission Calculation & Auditable Ledger

1. **Base Commission Rate**:
   - Configurable at marketplace level, provisionally initialized at **10.0% (0.10)** of the eligible item subtotal.
   - **Exclusion of Delivery Fees**: Delivery fees collected by the seller are 100% retained by the seller and are strictly excluded from the commission basis.
2. **Calculation Example**:
   - Seller Order: Item Subtotal = 1,500.00 ETB, Delivery Fee = 150.00 ETB.
   - Total Collected by Seller from Buyer = 1,650.00 ETB.
   - Marketplace Commission Due = 1,500.00 ETB × 10% = 150.00 ETB.
   - Seller Net Earnings = 1,350.00 ETB (products) + 150.00 ETB (delivery) = 1,500.00 ETB.
3. **Immutable Ledger Entries**:
   - All financial events are written as permanent, append-only records in `financialLedgerEntries`.
   - Historical entries cannot be modified or deleted. Errors are corrected via `ADMIN_ADJUSTMENT` or `COMMISSION_REVERSED`.
   - Allowed Ledger Types:
     - `COMMISSION_ACCRUED`: Recorded when order is marked `DELIVERED` & `COLLECTED`.
     - `COMMISSION_REVERSED`: Recorded upon approved order cancellation or full return.
     - `COD_COMMISSION_REMITTED`: Recorded when seller remits commission to platform and admin verifies payment.
     - `REFUND_ADJUSTMENT`: Recorded when partial or full refund is granted.
     - `ADMIN_ADJUSTMENT`: Discretionary adjustment with mandatory audit note.
     - `SETTLEMENT_RECORDED`: Periodic account reconciliation closure.

---

## 3. Delivery Coverage & Subcity Tier Pricing

1. **Seller-Configured Delivery**:
   - Each seller specifies their serviceable subcities within Addis Ababa and regional zones, along with flat or distance-tier delivery rates.
2. **Server-Side Revalidation**:
   - At checkout, the buyer's destination address (Subcity, Woreda, City) is verified against all sellers present in the multi-vendor cart.
   - If any vendor does not service the selected location, the checkout fails with explicit item-level guidance.

---

## 4. Product Moderation & Versioning Lifecycle

1. **Initial Submission**:
   - Newly created products are assigned status `PENDING_REVIEW` and are hidden from storefront queries.
   - Admin approves or rejects with feedback.
2. **Material Edits vs Minor Updates**:
   - Material edits (Title, Price, Variants, Primary Images, Category) to an approved product create a `pendingVersion` document clone.
   - The active `publishedVersion` remains visible to customers until an admin reviews and approves the changes.
   - Upon admin approval, the `pendingVersion` overwrites the active version and becomes live.

---

## 5. Cancellation, Return & Dispute Policies

1. **Cancellation Window**:
   - Buyers may request order cancellation directly via the secure tracking page.
   - If `fulfillmentStatus` is `PENDING` or `ACCEPTED`, the cancellation is automatically granted, restoring reserved inventory.
   - If `fulfillmentStatus` is `PROCESSING`, `READY_TO_DISPATCH`, or `SHIPPED`, the request escalates to an Admin Exception Queue.
2. **Returns & Refunds**:
   - Standard 48-hour return window for eligible goods upon verified delivery.
   - The platform verifies whether COD cash was collected. If collected, the refund resolution specifies the responsible party and execution method (e.g., direct seller cash refund or bank transfer).

---

## 6. Seller Suspension & Business Continuity

1. **Immediate Listing Suspension**:
   - Suspending a seller immediately unpublishes all active products and prevents new cart additions.
2. **Preservation of Outstanding Obligations**:
   - Seller suspension **never** deletes historical orders, customer tracking access, outstanding commission obligations, or ledger balances.
   - Admin handles existing in-flight orders via privileged resolution panel.

/**
 * ZEMEN MARKET — Currency and Exact ETB Subunit Math
 * 1 ETB = 100 santims (subunits)
 * Storing monetary values as integer cents/subunits prevents floating point inaccuracies.
 */

export function toSubunits(etbAmount: number): number {
  return Math.round(etbAmount * 100);
}

export function fromSubunits(subunits: number): number {
  return subunits / 100;
}

export function formatETB(amountInEtbOrSubunits: number, isSubunits: boolean = false): string {
  const etb = isSubunits ? fromSubunits(amountInEtbOrSubunits) : amountInEtbOrSubunits;
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(etb)
    .replace("ETB", "ETB ");
}

/**
 * Calculates marketplace commission for product sales.
 * Keeps delivery fees outside platform commission unless explicitly configured.
 */
export function calculateCommissionSubunits(
  itemsSubtotalSubunits: number,
  commissionRate: number = 0.10
): number {
  return Math.round(itemsSubtotalSubunits * commissionRate);
}

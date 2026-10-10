/**
 * ZEMEN MARKET (ዘመን ገበያ) — Core Marketplace Policy Settings & Rules
 * Immutable defaults and central configuration parameters.
 */

export const MARKETPLACE_CONFIG = {
  name: "ZEMEN MARKET",
  amharicName: "ዘመን ገበያ",
  currency: "ETB",
  currencySymbol: "ETB",
  currencySubunits: 100, // 1 ETB = 100 santims (subunits for exact integer math)

  // Commission Configuration
  defaultCommissionRate: 0.10, // 10% on eligible product subtotal
  commissionAppliesToDeliveryFees: false, // Delivery fees are 100% retained by seller

  // Order & Fulfillment Thresholds
  guestOrderTrackingTokenLength: 32, // bytes for cryptographically secure tracking token
  maxItemsPerOrder: 50,
  maxQuantityPerItem: 10,

  // Return & Cancellation Rules
  returnWindowHours: 48, // 48-hour return window for eligible products
  autoCancellationAllowedStatuses: ["PENDING", "ACCEPTED"], // Can cancel automatically before processing/shipping

  // Remittance Policies
  allowedRemittanceMethods: [
    { id: "CBE_BIRR", label: "CBE Birr / Commercial Bank of Ethiopia" },
    { id: "TELEBIRR", label: "Telebirr" },
    { id: "AWASH_BANK", label: "Awash Bank" },
    { id: "BANK_TRANSFER", label: "Direct Bank Transfer" },
  ],

  // Pagination & Limits
  defaultPageSize: 12,
  catalogPageSize: 20,
} as const;

export type MarketplaceConfig = typeof MARKETPLACE_CONFIG;

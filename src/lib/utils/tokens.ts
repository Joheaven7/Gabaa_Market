import crypto from "crypto";

/**
 * Generates a high-entropy random URL-safe tracking token.
 */
export function generateTrackingToken(byteLength: number = 24): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Hashes a tracking token using SHA-256 for secure database storage.
 */
export function hashTrackingToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a human-friendly unique order reference.
 * E.g., ZMN-849201-ET
 */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ZM-${datePart}-${randomPart}`;
}

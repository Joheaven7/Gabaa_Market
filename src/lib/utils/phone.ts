/**
 * ZEMEN MARKET — Ethiopian Mobile Phone Validator & Normalizer
 * Standard Ethiopian phone format:
 * - Safaricom: +251 7... / 07...
 * - Ethio Telecom: +251 9... / 09...
 */

export function isValidEthiopianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // Regex for +251 followed by 9 or 7 and 8 digits, or 0 followed by 9 or 7 and 8 digits
  const regex = /^(?:\+251|251|0)(9\d{8}|7\d{8})$/;
  return regex.test(cleaned);
}

export function normalizeEthiopianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const match = cleaned.match(/^(?:\+251|251|0)(9\d{8}|7\d{8})$/);
  if (match && match[1]) {
    return `+251${match[1]}`;
  }
  return phone;
}

/**
 * Verification-only patterns: assert sensitive literals do not appear in redacted / LLM-bound text.
 * This does not implement production redaction; it guards against obvious leakage.
 */

export interface LeakPattern {
  name: string;
  test: (s: string) => boolean;
}

/** US SSN pattern (test formats). */
const ssnLike = /\b\d{3}-\d{2}-\d{4}\b/;
const emailLike = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
const phoneLoose = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
/**
 * Test PAN shapes (16-digit groups or 15-digit Amex) — verification only.
 * Separators between groups are required: optional groups made `\d{4}` stanzas
 * inside UUIDs (e.g. 4903510417194289 from 49035104-1719-4289-…) match
 * 16 raw digits and false-positive the leak check.
 */
const cardLike =
  /\b(?:\d{4}[-\s]){3}\d{4}\b|\b3[47]\d{13}\b/;
const apiKeyLike = /\b(?:sk|pk|rk)[-_][a-zA-Z0-9]{16,}\b/i;

export const leakPatterns: LeakPattern[] = [
  { name: "ssn_like", test: (s) => ssnLike.test(s) },
  { name: "email_like", test: (s) => emailLike.test(s) },
  { name: "phone_like", test: (s) => phoneLoose.test(s) },
  { name: "card_like", test: (s) => cardLike.test(s) },
  { name: "api_key_like", test: (s) => apiKeyLike.test(s) },
];

export function findLeaks(
  text: string,
  patterns: LeakPattern[] = leakPatterns,
): string[] {
  return patterns.filter((p) => p.test(text)).map((p) => p.name);
}

import type { RedactApiAnalyzeResponse } from "../src/types.js";

/**
 * Runtime shape check for Redact `/api/v1/analyze` JSON (lightweight, no AJV).
 */
export function isRedactAnalyzeResponse(
  value: unknown,
): value is RedactApiAnalyzeResponse {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.results)) return false;
  for (const item of v.results) {
    if (item === null || typeof item !== "object") return false;
    const r = item as Record<string, unknown>;
    if (typeof r.entity_type !== "string") return false;
    if (typeof r.start !== "number") return false;
    if (typeof r.end !== "number") return false;
    if (typeof r.score !== "number") return false;
  }
  if (v.metadata !== undefined) {
    const m = v.metadata;
    if (m === null || typeof m !== "object") return false;
  }
  return true;
}

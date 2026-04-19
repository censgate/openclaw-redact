/**
 * Redact base URL for verification runs (no trailing slash).
 */
export function getVerifyEndpoint(): string {
  const raw =
    process.env.REDACT_VERIFY_ENDPOINT ??
    process.env.REDACT_API_ENDPOINT ??
    "http://127.0.0.1:8080";
  return raw.replace(/\/$/, "");
}

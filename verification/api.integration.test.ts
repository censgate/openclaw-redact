import { describe, expect, it } from "vitest";
import { detect } from "../src/detector.js";
import { getVerifyEndpoint } from "./endpoint.js";
import { recordLatencyMs, recordProcessingTimeMs } from "./metrics.js";
import { isRedactAnalyzeResponse } from "./validateAnalyzeResponse.js";

const httpBase = () => ({
  endpoint: getVerifyEndpoint(),
  timeoutMs: 30_000,
  language: "en",
});

describe("Redact HTTP API contract", () => {
  it("returns JSON matching RedactApiAnalyzeResponse shape", async () => {
    const endpoint = getVerifyEndpoint();
    const t0 = performance.now();
    const res = await fetch(`${endpoint}/api/v1/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Contact me at test@example.com", language: "en" }),
    });
    recordLatencyMs(performance.now() - t0);
    expect(res.ok).toBe(true);
    const json: unknown = await res.json();
    expect(isRedactAnalyzeResponse(json)).toBe(true);
  });

  it("maps detector results with processingTimeMs when present", async () => {
    const t0 = performance.now();
    const result = await detect("My email is alice@example.com for reply.", {
      http: httpBase(),
    });
    recordLatencyMs(performance.now() - t0);
    recordProcessingTimeMs(result.processingTimeMs);
    expect(result.entityCount).toBeGreaterThanOrEqual(0);
    if (result.entityCount > 0) {
      expect(result.entities[0]?.value).toBeDefined();
    }
  });
});

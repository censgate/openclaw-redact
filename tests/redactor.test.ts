import { afterEach, describe, expect, it, vi } from "vitest";
import { redact } from "../src/redactor.js";

describe("redact", () => {
  const fetchMock = vi.fn();
  const http = {
    endpoint: "http://localhost:8080",
    timeoutMs: 1000,
    language: "en",
  };

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("redacts emails in reversible mode", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        results: [
          {
            entity_type: "EMAIL_ADDRESS",
            start: 8,
            end: 24,
            score: 0.9,
            text: "john@example.com",
          },
        ],
      }),
    );

    const result = await redact("Send to john@example.com", {
      mode: "reversible",
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.redactedText).not.toContain("john@example.com");
    expect(result.redactedText).toMatch(/\[REDACTED:EMAIL_ADDRESS:[a-f0-9-]+\]/);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].originalValue).toBe("john@example.com");
  });

  it("redacts emails in irreversible mode", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        results: [
          {
            entity_type: "EMAIL_ADDRESS",
            start: 8,
            end: 24,
            score: 0.9,
            text: "john@example.com",
          },
        ],
      }),
    );

    const result = await redact("Send to john@example.com", {
      mode: "irreversible",
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.redactedText).toContain("[REDACTED:EMAIL_ADDRESS]");
    expect(result.tokens[0].originalValue).toBeUndefined();
  });

  it("preserves original text in audit-only mode", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        results: [
          {
            entity_type: "EMAIL_ADDRESS",
            start: 8,
            end: 24,
            score: 0.9,
            text: "john@example.com",
          },
        ],
      }),
    );

    const result = await redact("Send to john@example.com", {
      mode: "audit-only",
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.redactedText).toBe("Send to john@example.com");
    expect(result.entityCount).toBe(1);
  });

  it("returns unchanged text when no entities found", async () => {
    fetchMock.mockResolvedValue(createResponse({ results: [] }));
    const result = await redact("Hello world", {
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.redactedText).toBe("Hello world");
    expect(result.tokens).toHaveLength(0);
    expect(result.entityCount).toBe(0);
  });

  it("redacts multiple entities", async () => {
    const text = "Email: user@test.com, SSN: 123-45-6789";
    fetchMock.mockResolvedValue(
      createResponse({
        results: [
          {
            entity_type: "EMAIL_ADDRESS",
            start: 7,
            end: 20,
            score: 0.9,
            text: "user@test.com",
          },
          {
            entity_type: "US_SSN",
            start: 27,
            end: 38,
            score: 0.9,
            text: "123-45-6789",
          },
        ],
      }),
    );

    const result = await redact(text, {
      mode: "reversible",
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.redactedText).not.toContain("user@test.com");
    expect(result.redactedText).not.toContain("123-45-6789");
    expect(result.entityCount).toBeGreaterThanOrEqual(2);
  });
});

function createResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

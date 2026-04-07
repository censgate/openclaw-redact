import { afterEach, describe, expect, it, vi } from "vitest";
import { detect } from "../src/detector.js";

describe("detect", () => {
  const fetchMock = vi.fn();
  const http = {
    endpoint: "http://localhost:8080",
    timeoutMs: 1000,
    language: "en",
  };

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("maps API detections into entities", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        results: [
          {
            entity_type: "EMAIL_ADDRESS",
            start: 14,
            end: 30,
            score: 0.9,
            text: "john@example.com",
            recognizer_name: "PatternRecognizer",
          },
        ],
        metadata: { processing_time_ms: 2 },
      }),
    );

    const result = await detect("Contact me at john@example.com please", {
      http,
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(result.entityCount).toBe(1);
    expect(result.processingTimeMs).toBe(2);
    expect(result.entities[0].type).toBe("EMAIL_ADDRESS");
    expect(result.entities[0].category).toBe("pii");
    expect(result.entities[0].value).toBe("john@example.com");
  });

  it("removes overlapping detections", async () => {
    const text = "Contact john@example.com";
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
          {
            entity_type: "DOMAIN_NAME",
            start: 13,
            end: 24,
            score: 0.7,
            text: "example.com",
          },
        ],
      }),
    );

    const result = await detect(text, {
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].type).toBe("EMAIL_ADDRESS");
  });

  it("returns empty results when API finds no entities", async () => {
    fetchMock.mockResolvedValue(createResponse({ results: [] }));
    const result = await detect("Hello world, this is a test.", {
      http,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.entityCount).toBe(0);
    expect(result.entities).toHaveLength(0);
  });
});

function createResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

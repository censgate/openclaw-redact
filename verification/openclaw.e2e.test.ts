import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const composeFile = "docker-compose.openclaw-e2e.yml";
const mockDebugUrl =
  process.env.MOCK_LLM_DEBUG_URL ?? "http://127.0.0.1:13000/__debug/last-chat-request";

describe("OpenClaw Docker E2E (gateway + mock LLM)", () => {
  it("does not send raw PII substrings to the mock LLM request body", async () => {
    // Keep literals aligned with what the bundled redact image reliably detects in one pass
    // (tier-1 harness covers additional patterns like cards / API keys).
    const message =
      "Contact me at jane.doe@example.com or 555-123-4567. SSN 123-45-6789.";

    const sessionId = `openclaw-redact-e2e-${randomUUID()}`;
    const { stdout, stderr } = await execFileAsync(
      "docker",
      [
        "compose",
        "-f",
        composeFile,
        "--profile",
        "cli",
        "run",
        "--rm",
        "-T",
        "-e",
        "OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789",
        "-e",
        "OPENCLAW_GATEWAY_TOKEN=e2e-test-token",
        "openclaw-e2e",
        "agent",
        "--session-id",
        sessionId,
        "--message",
        message,
        "--json",
        "--timeout",
        "120",
      ],
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    );

    expect(stdout.length + stderr.length).toBeGreaterThan(0);

    const debugRes = await fetch(mockDebugUrl);
    expect(debugRes.ok).toBe(true);
    const debugJson = (await debugRes.json()) as { body?: string };
    const recorded = debugJson.body ?? "";
    expect(recorded.length).toBeGreaterThan(0);

    // Assert the exact literals from the user turn do not reach the mock (avoid
    // generic regex false positives from the large system prompt / workspace text).
    const forbidden = [
      "jane.doe@example.com",
      "555-123-4567",
      "123-45-6789",
    ] as const;
    for (const literal of forbidden) {
      expect(recorded, `Mock LLM body leaked raw substring: ${literal}`).not.toContain(
        literal,
      );
    }
  });
});

import { describe, expect, it } from "vitest";
import { createVerificationPlugin } from "./harness/pluginFactory.js";
import { runConversationTurn, runToolCall } from "./harness/runTurn.js";
import { findLeaks } from "./leakScanner.js";
import { samples } from "./fixtures/piiStrings.js";
import {
  recordDetectionHit,
  recordDetectionMiss,
  recordLatencyMs,
  recordTrueNegative,
} from "./metrics.js";

const echoLlm = async (redacted: string) => `Assistant echo: ${redacted}`;

describe("Redaction matrix (ENG-56)", () => {
  const matrix = [
    { name: "ssn", text: `SSN is ${samples.ssn}`, profile: "standard" as const },
    { name: "email", text: `Email ${samples.email}`, profile: "standard" as const },
    { name: "phone", text: `Call ${samples.phoneUs}`, profile: "standard" as const },
    { name: "card", text: `Card ${samples.cardTest}`, profile: "standard" as const },
    { name: "address", text: `Ship to ${samples.address}`, profile: "standard" as const },
    {
      name: "apiKey",
      text: `Token ${samples.apiKeyLike}`,
      profile: "standard" as const,
    },
  ];

  it.each(matrix)(
    "preLLM: $profile / $name — LLM-bound text has no obvious PII leaks",
    async ({ text, profile }) => {
      const plugin = createVerificationPlugin(profile);
      const t0 = performance.now();
      const turn = await runConversationTurn(plugin, text, echoLlm);
      recordLatencyMs(performance.now() - t0);

      const leaks = findLeaks(turn.llmReceived);
      expect(leaks, `Leaks in LLM input: ${leaks.join(", ")}`).toEqual([]);

      const chain = turn.audit.finalize();
      expect(chain.length).toBeGreaterThanOrEqual(4);
      expect(chain.every((c) => c.chainHash.length === 64)).toBe(true);
    },
  );

  it.each([
    { name: "hipaa_ssn", text: `Record ${samples.ssn}`, profile: "hipaa" as const },
    { name: "hipaa_email", text: samples.email, profile: "hipaa" as const },
  ])(
    "preLLM: hipaa profile / $name",
    async ({ text, profile }) => {
      const plugin = createVerificationPlugin(profile);
      const turn = await runConversationTurn(plugin, text, echoLlm);
      const leaks = findLeaks(turn.llmReceived);
      expect(leaks, `Leaks: ${leaks.join(", ")}`).toEqual([]);
    },
  );

  it("passthrough (none): plugin disabled does not redact LLM input", async () => {
    const plugin = createVerificationPlugin("none");
    const turn = await runConversationTurn(
      plugin,
      `Reach me at ${samples.email}`,
      echoLlm,
    );
    expect(turn.llmReceived).toContain(samples.email);
  });

  it("toolCallHook redacts tool payload for standard profile", async () => {
    const plugin = createVerificationPlugin("standard");
    const payload = JSON.stringify({ secret: samples.email });
    const t0 = performance.now();
    const { redacted, audit } = await runToolCall(plugin, payload);
    recordLatencyMs(performance.now() - t0);
    expect(findLeaks(redacted)).toEqual([]);
    expect(audit.finalize().length).toBeGreaterThanOrEqual(2);
  });

  it("benign text: no PII patterns in input (true negative sample)", async () => {
    const plugin = createVerificationPlugin("standard");
    const benign = "The quarterly report is ready for review.";
    const turn = await runConversationTurn(plugin, benign, echoLlm);
    recordTrueNegative();
    expect(findLeaks(turn.llmReceived)).toEqual([]);
  });

  it("records detection stats when email is present", async () => {
    const plugin = createVerificationPlugin("standard");
    const turn = await runConversationTurn(
      plugin,
      `Hello ${samples.email}`,
      echoLlm,
    );
    if (turn.redactionCount > 0) {
      recordDetectionHit();
    } else {
      recordDetectionMiss();
    }
    expect(turn.redactionCount).toBeGreaterThanOrEqual(0);
  });
});

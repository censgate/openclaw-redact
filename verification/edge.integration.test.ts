import { describe, expect, it } from "vitest";
import { createVerificationPlugin } from "./harness/pluginFactory.js";
import { runConversationTurn } from "./harness/runTurn.js";
import { findLeaks } from "./leakScanner.js";
import {
  adversarialBypass,
  nestedJsonWithPii,
  samples,
  unicodeName,
} from "./fixtures/piiStrings.js";
import { recordLatencyMs } from "./metrics.js";

const echoLlm = async (redacted: string) => `Reply: ${redacted}`;

describe("Edge cases (ENG-56)", () => {
  it("nested JSON with embedded PII", async () => {
    const plugin = createVerificationPlugin("standard");
    const t0 = performance.now();
    const turn = await runConversationTurn(
      plugin,
      `Payload: ${nestedJsonWithPii}`,
      echoLlm,
    );
    recordLatencyMs(performance.now() - t0);
    expect(findLeaks(turn.llmReceived)).toEqual([]);
  });

  it("unicode / international text", async () => {
    const plugin = createVerificationPlugin("standard");
    const turn = await runConversationTurn(
      plugin,
      `${unicodeName} ${samples.email}`,
      echoLlm,
    );
    expect(findLeaks(turn.llmReceived)).toEqual([]);
  });

  it.each([...adversarialBypass])(
    "adversarial prompt: %s",
    async (prompt) => {
      const plugin = createVerificationPlugin("standard");
      const turn = await runConversationTurn(plugin, prompt, echoLlm);
      expect(findLeaks(turn.llmReceived)).toEqual([]);
    },
  );

  it("large payload (~100KB) with embedded email", async () => {
    const plugin = createVerificationPlugin("standard");
    const padding = "x".repeat(100_000);
    const text = `${padding}\nContact: ${samples.email}\n`;
    const t0 = performance.now();
    const turn = await runConversationTurn(plugin, text, echoLlm);
    recordLatencyMs(performance.now() - t0);
    expect(findLeaks(turn.llmReceived)).toEqual([]);
  }, 180_000);

  it("concurrent turns with distinct isolation", async () => {
    const plugin = createVerificationPlugin("standard");
    const turns = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        runConversationTurn(
          plugin,
          `User ${i} email ${samples.email}`,
          echoLlm,
          { turnId: `turn-${i}-${Date.now()}` },
        ),
      ),
    );
    for (const t of turns) {
      expect(findLeaks(t.llmReceived)).toEqual([]);
    }
  });
});

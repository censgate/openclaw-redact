import { describe, it, expect } from "vitest";
import { OpenClawRedactPlugin } from "../src/plugin.js";

describe("OpenClawRedactPlugin", () => {
  it("creates with default config", () => {
    const plugin = new OpenClawRedactPlugin();
    expect(plugin.enabled).toBe(true);
  });

  it("can be disabled", () => {
    const plugin = new OpenClawRedactPlugin({ enabled: false });
    expect(plugin.enabled).toBe(false);
  });

  it("preLLMHook redacts sensitive data", () => {
    const plugin = new OpenClawRedactPlugin();
    const result = plugin.preLLMHook({
      message: "My email is user@example.com",
    });
    expect(result.message).not.toContain("user@example.com");
    expect(result.metadata?.redactionCount).toBe(1);
  });

  it("preLLMHook passes through when disabled", () => {
    const plugin = new OpenClawRedactPlugin({ enabled: false });
    const result = plugin.preLLMHook({
      message: "My email is user@example.com",
    });
    expect(result.message).toBe("My email is user@example.com");
  });

  it("preLLMHook skips excluded agents", () => {
    const plugin = new OpenClawRedactPlugin({
      config: {
        mode: "reversible",
        entities: ["pii"],
        customPatterns: [],
        excludeAgents: ["trusted-agent"],
        logRedactions: false,
      },
    });
    const result = plugin.preLLMHook({
      agentId: "trusted-agent",
      message: "My email is user@example.com",
    });
    expect(result.message).toBe("My email is user@example.com");
  });

  it("postLLMHook restores redacted data", () => {
    const plugin = new OpenClawRedactPlugin();
    const turnId = "test-turn-1";

    // Pre-LLM: redact
    const preResult = plugin.preLLMHook({
      message: "My email is user@example.com",
      metadata: { turnId },
    });
    expect(preResult.message).not.toContain("user@example.com");

    // Post-LLM: the LLM echoed back the redacted token
    const postResult = plugin.postLLMHook({
      message: preResult.message,
      metadata: { turnId },
    });
    expect(postResult.message).toContain("user@example.com");
  });

  it("toolCallHook redacts tool parameters", () => {
    const plugin = new OpenClawRedactPlugin();
    const result = plugin.toolCallHook({
      message: '{"query": "user@example.com"}',
    });
    expect(result.message).not.toContain("user@example.com");
  });

  it("clears token store", () => {
    const plugin = new OpenClawRedactPlugin();
    const turnId = "test-turn-2";

    plugin.preLLMHook({
      message: "My email is user@example.com",
      metadata: { turnId },
    });
    expect(plugin.getStoredTokens(turnId)).toBeDefined();

    plugin.clearTokenStore();
    expect(plugin.getStoredTokens(turnId)).toBeUndefined();
  });

  it("does not store tokens for clean messages", () => {
    const plugin = new OpenClawRedactPlugin();
    const turnId = "test-turn-clean";

    plugin.preLLMHook({
      message: "Hello world, no sensitive data here",
      metadata: { turnId },
    });

    expect(plugin.getStoredTokens(turnId)).toBeUndefined();
  });
});

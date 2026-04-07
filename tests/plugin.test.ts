import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenClawRedactPlugin } from "../src/plugin.js";

describe("OpenClawRedactPlugin", () => {
  const fetchMock = vi.fn();
  const pluginConfig = {
    config: {
      http: {
        endpoint: "http://localhost:8080",
        timeoutMs: 1000,
        language: "en",
      },
    },
  };

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("creates with default config", () => {
    const plugin = new OpenClawRedactPlugin();
    expect(plugin.enabled).toBe(true);
  });

  it("can be disabled", () => {
    const plugin = new OpenClawRedactPlugin({ enabled: false });
    expect(plugin.enabled).toBe(false);
  });

  it("preLLMHook redacts sensitive data", async () => {
    mockEmailDetection(fetchMock);
    const plugin = new OpenClawRedactPlugin(pluginConfig, {
      fetchImpl: fetchMock as typeof fetch,
    });
    const result = await plugin.preLLMHook({
      message: "My email is user@example.com",
    });
    expect(result.message).not.toContain("user@example.com");
    expect(result.metadata?.redactionCount).toBe(1);
  });

  it("preLLMHook passes through when disabled", async () => {
    const plugin = new OpenClawRedactPlugin(
      { enabled: false, ...pluginConfig },
      { fetchImpl: fetchMock as typeof fetch },
    );
    const result = await plugin.preLLMHook({
      message: "My email is user@example.com",
    });
    expect(result.message).toBe("My email is user@example.com");
  });

  it("preLLMHook skips excluded agents", async () => {
    const plugin = new OpenClawRedactPlugin({
      config: {
        mode: "reversible",
        excludeAgents: ["trusted-agent"],
        logRedactions: false,
        http: {
          endpoint: "http://localhost:8080",
          timeoutMs: 1000,
          language: "en",
        },
      },
    }, { fetchImpl: fetchMock as typeof fetch });
    const result = await plugin.preLLMHook({
      agentId: "trusted-agent",
      message: "My email is user@example.com",
    });
    expect(result.message).toBe("My email is user@example.com");
  });

  it("postLLMHook restores redacted data", async () => {
    mockEmailDetection(fetchMock);
    const plugin = new OpenClawRedactPlugin(pluginConfig, {
      fetchImpl: fetchMock as typeof fetch,
    });
    const turnId = "test-turn-1";

    // Pre-LLM: redact
    const preResult = await plugin.preLLMHook({
      message: "My email is user@example.com",
      metadata: { turnId },
    });
    expect(preResult.message).not.toContain("user@example.com");

    // Post-LLM: the LLM echoed back the redacted token
    const postResult = await plugin.postLLMHook({
      message: preResult.message,
      metadata: { turnId },
    });
    expect(postResult.message).toContain("user@example.com");
  });

  it("toolCallHook redacts tool parameters", async () => {
    mockEmailDetection(fetchMock);
    const plugin = new OpenClawRedactPlugin(pluginConfig, {
      fetchImpl: fetchMock as typeof fetch,
    });
    const result = await plugin.toolCallHook({
      message: '{"query": "user@example.com"}',
    });
    expect(result.message).not.toContain("user@example.com");
  });

  it("clears token store", async () => {
    mockEmailDetection(fetchMock);
    const plugin = new OpenClawRedactPlugin(pluginConfig, {
      fetchImpl: fetchMock as typeof fetch,
    });
    const turnId = "test-turn-2";

    await plugin.preLLMHook({
      message: "My email is user@example.com",
      metadata: { turnId },
    });
    expect(plugin.getStoredTokens(turnId)).toBeDefined();

    plugin.clearTokenStore();
    expect(plugin.getStoredTokens(turnId)).toBeUndefined();
  });

  it("does not store tokens for clean messages", async () => {
    fetchMock.mockResolvedValue(createResponse({ results: [] }));
    const plugin = new OpenClawRedactPlugin(pluginConfig, {
      fetchImpl: fetchMock as typeof fetch,
    });
    const turnId = "test-turn-clean";

    await plugin.preLLMHook({
      message: "Hello world, no sensitive data here",
      metadata: { turnId },
    });

    expect(plugin.getStoredTokens(turnId)).toBeUndefined();
  });

  it("auto-start updates endpoint when dynamic port is assigned", async () => {
    const bootstrapper = {
      ensureRunning: vi
        .fn()
        .mockResolvedValue({ endpoint: "http://127.0.0.1:19090" }),
    };
    fetchMock
      .mockRejectedValueOnce(new Error("fetch failed"))
      // readiness probe after bootstrap
      .mockResolvedValueOnce(createResponse({ results: [] }))
      // retry of the original redact call
      .mockResolvedValueOnce(
        createResponse({
          results: [
            {
              entity_type: "EMAIL_ADDRESS",
              start: 12,
              end: 28,
              score: 0.9,
              text: "user@example.com",
            },
          ],
        }),
      );

    const plugin = new OpenClawRedactPlugin(
      {
        config: {
          http: {
            endpoint: "http://127.0.0.1:8080",
            timeoutMs: 1000,
            language: "en",
            docker: {
              enabled: true,
            },
          },
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
        backendBootstrapper: bootstrapper,
      },
    );

    const result = await plugin.preLLMHook({
      message: "My email is user@example.com",
    });

    expect(result.message).not.toContain("user@example.com");
    expect(bootstrapper.ensureRunning).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("127.0.0.1:19090");
    expect(fetchMock.mock.calls[2][0]).toContain("127.0.0.1:19090");
  });

  it("self-heals on later backend outages while running", async () => {
    const bootstrapper = {
      ensureRunning: vi
        .fn()
        .mockResolvedValue({ endpoint: "http://127.0.0.1:19090" }),
    };

    fetchMock
      // First request: fail, bootstrap readiness, retry success
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(createResponse({ results: [] }))
      .mockResolvedValueOnce(
        createResponse({
          results: [
            {
              entity_type: "EMAIL_ADDRESS",
              start: 12,
              end: 28,
              score: 0.9,
              text: "user@example.com",
            },
          ],
        }),
      )
      // Second request: fail again, bootstrap readiness, retry success
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(createResponse({ results: [] }))
      .mockResolvedValueOnce(
        createResponse({
          results: [
            {
              entity_type: "EMAIL_ADDRESS",
              start: 12,
              end: 28,
              score: 0.9,
              text: "user@example.com",
            },
          ],
        }),
      );

    const plugin = new OpenClawRedactPlugin(
      {
        config: {
          http: {
            endpoint: "http://127.0.0.1:8080",
            timeoutMs: 1000,
            language: "en",
            docker: {
              enabled: true,
              restartOnFailure: true,
            },
          },
        },
      },
      {
        fetchImpl: fetchMock as typeof fetch,
        backendBootstrapper: bootstrapper,
      },
    );

    await plugin.preLLMHook({ message: "My email is user@example.com" });
    await plugin.preLLMHook({ message: "My email is user@example.com" });

    expect(bootstrapper.ensureRunning).toHaveBeenCalledTimes(2);
    expect(bootstrapper.ensureRunning.mock.calls[0][1]).toEqual({
      restartIfRunning: false,
    });
    expect(bootstrapper.ensureRunning.mock.calls[1][1]).toEqual({
      restartIfRunning: true,
    });
  });
});

function mockEmailDetection(fetchMock: ReturnType<typeof vi.fn>): void {
  fetchMock.mockResolvedValue(
    createResponse({
      results: [
        {
          entity_type: "EMAIL_ADDRESS",
          start: 12,
          end: 28,
          score: 0.9,
          text: "user@example.com",
        },
      ],
    }),
  );
}

function createResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

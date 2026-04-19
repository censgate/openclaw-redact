import { definePluginEntry, emptyPluginConfigSchema } from "openclaw/plugin-sdk/plugin-entry";
import type {
  OpenClawPluginApi,
  ProviderWrapStreamFnContext,
} from "openclaw/plugin-sdk/plugin-entry";
import { OpenClawRedactPlugin } from "./plugin.js";
import type { PluginConfigInput, RedactionToken } from "./types.js";
import { resolveConfig } from "./config.js";
import { restore } from "./restorer.js";
import { redact } from "./redactor.js";

/** Last outbound turn tokens for restoring assistant text (single-flight; E2E uses one session). */
let lastOutboundTokens: RedactionToken[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function redactWithConfig(
  text: string,
  cfg: ReturnType<typeof resolveConfig>,
): Promise<{ text: string; tokens: RedactionToken[] }> {
  const result = await redact(text, {
    mode: cfg.config.mode,
    http: cfg.config.http,
  });
  return { text: result.redactedText, tokens: result.tokens };
}

/**
 * Redact outbound user message text before it reaches the LLM transport.
 * Tool/assistant payloads are handled by `before_tool_call` / other hooks; deep-walking those structures is slow and can break streaming.
 */
async function redactMessageListContents(
  messages: unknown[],
  cfg: ReturnType<typeof resolveConfig>,
): Promise<{ messages: unknown[]; tokens: RedactionToken[] }> {
  const allTokens: RedactionToken[] = [];
  const out: unknown[] = [];
  for (const msg of messages) {
    if (!isRecord(msg)) {
      out.push(msg);
      continue;
    }
    const role = typeof msg.role === "string" ? msg.role : "";
    if (role !== "user" || !("content" in msg)) {
      out.push(msg);
      continue;
    }
    const content = msg.content;
    if (typeof content === "string") {
      const r = await redactWithConfig(content, cfg);
      allTokens.push(...r.tokens);
      out.push({ ...msg, content: r.text });
      continue;
    }
    const { value, tokens } = await redactDeepStrings(content, cfg);
    allTokens.push(...tokens);
    out.push({ ...msg, content: value });
  }
  return { messages: out, tokens: allTokens };
}

async function redactDeepStrings(
  value: unknown,
  cfg: ReturnType<typeof resolveConfig>,
): Promise<{ value: unknown; tokens: RedactionToken[] }> {
  if (typeof value === "string") {
    const r = await redactWithConfig(value, cfg);
    return { value: r.text, tokens: r.tokens };
  }
  if (Array.isArray(value)) {
    const tokens: RedactionToken[] = [];
    const next: unknown[] = [];
    for (const item of value) {
      const r = await redactDeepStrings(item, cfg);
      tokens.push(...r.tokens);
      next.push(r.value);
    }
    return { value: next, tokens };
  }
  if (isRecord(value)) {
    const tokens: RedactionToken[] = [];
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = await redactDeepStrings(v, cfg);
      tokens.push(...r.tokens);
      next[k] = r.value;
    }
    return { value: next, tokens };
  }
  return { value, tokens: [] };
}

function buildMockProviderPlugin(
  cfg: ReturnType<typeof resolveConfig>,
  plugin: OpenClawRedactPlugin,
): Parameters<OpenClawPluginApi["registerProvider"]>[0] {
  return {
    id: "censgate-mock",
    pluginId: "censgate-redact",
    label: "Censgate mock OpenAI-compatible (E2E)",
    auth: [],
    /**
     * Redact inside `onPayload` (awaited by pi-ai before the HTTP request) so this
     * wrapper returns a stream synchronously. Returning a Promise from `wrapStreamFn`
     * breaks OpenClaw's `streamWithPayloadPatch` chain (e.g. OpenAI string flattening).
     */
    wrapStreamFn: (wrapCtx: ProviderWrapStreamFnContext) => {
      const inner = wrapCtx.streamFn;
      if (!inner) return undefined;
      return (model, context, options) => {
        if (!plugin.enabled || !context) {
          return inner(model, context, options);
        }
        const originalOnPayload = options?.onPayload;
        return inner(model, context, {
          ...options,
          onPayload: async (payload: unknown, modelArg) => {
            if (!isRecord(payload) || !Array.isArray(payload.messages)) {
              return originalOnPayload?.(payload, modelArg);
            }
            const { messages: redacted, tokens } = await redactMessageListContents(
              [...payload.messages],
              cfg,
            );
            lastOutboundTokens = tokens;
            const nextPayload = { ...payload, messages: redacted };
            const fromUser = await originalOnPayload?.(nextPayload, modelArg);
            return fromUser !== undefined ? fromUser : nextPayload;
          },
        });
      };
    },
  };
}

export default definePluginEntry({
  id: "censgate-redact",
  name: "Censgate OpenClaw Redact",
  description:
    "Privacy-preserving redaction for LLM-bound text via the censgate/redact HTTP API.",
  configSchema: emptyPluginConfigSchema(),
  register(api) {
    const raw = (api.pluginConfig ?? {}) as PluginConfigInput;
    const resolved = resolveConfig(raw);
    const plugin = new OpenClawRedactPlugin(raw);

    api.registerProvider(buildMockProviderPlugin(resolved, plugin));

    api.on("llm_output", async (event) => {
      if (!plugin.enabled || lastOutboundTokens.length === 0) return;
      const tokens = lastOutboundTokens;
      lastOutboundTokens = [];
      if (event.assistantTexts?.length) {
        event.assistantTexts = event.assistantTexts.map((t) =>
          restore(t, tokens),
        );
      }
    });

    api.on("before_tool_call", async (event) => {
      if (!plugin.enabled) return;
      const out = await plugin.toolCallHook({
        message: JSON.stringify(event.params),
        metadata: {},
      });
      try {
        event.params = JSON.parse(out.message) as Record<string, unknown>;
      } catch {
        /* keep original */
      }
    });
  },
});

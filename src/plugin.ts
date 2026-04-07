import type {
  OpenClawHookContext,
  OpenClawHookResult,
  PluginConfig,
  PluginConfigInput,
  RedactionToken,
} from "./types.js";
import { resolveConfig } from "./config.js";
import { redact } from "./redactor.js";
import { restore } from "./restorer.js";

export class OpenClawRedactPlugin {
  private config: PluginConfig;
  private tokenStore: Map<string, RedactionToken[]> = new Map();
  private fetchImpl?: typeof fetch;

  constructor(
    userConfig?: PluginConfigInput,
    options?: { fetchImpl?: typeof fetch },
  ) {
    this.config = resolveConfig(userConfig);
    this.fetchImpl = options?.fetchImpl;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  async preLLMHook(context: OpenClawHookContext): Promise<OpenClawHookResult> {
    if (!this.config.enabled) {
      return { message: context.message, metadata: context.metadata };
    }

    if (this.isExcludedAgent(context.agentId)) {
      return { message: context.message, metadata: context.metadata };
    }

    const result = await redact(context.message, {
      mode: this.config.config.mode,
      http: this.config.config.http,
      fetchImpl: this.fetchImpl,
    });

    if (result.entityCount > 0 && this.config.config.logRedactions) {
      console.log(
        `[openclaw-redact] Redacted ${result.entityCount} entities`,
      );
    }

    // Store tokens for potential restoration keyed by a conversation turn id
    const turnId =
      (context.metadata?.turnId as string) ?? crypto.randomUUID();
    if (result.tokens.length > 0) {
      this.tokenStore.set(turnId, result.tokens);
    }

    return {
      message: result.redactedText,
      metadata: {
        ...context.metadata,
        turnId,
        redactionCount: result.entityCount,
      },
    };
  }

  async postLLMHook(context: OpenClawHookContext): Promise<OpenClawHookResult> {
    if (!this.config.enabled) {
      return { message: context.message, metadata: context.metadata };
    }

    const turnId = context.metadata?.turnId as string | undefined;
    if (!turnId) {
      return { message: context.message, metadata: context.metadata };
    }

    const tokens = this.tokenStore.get(turnId);
    if (!tokens || tokens.length === 0) {
      this.tokenStore.delete(turnId);
      return { message: context.message, metadata: context.metadata };
    }

    const restoredMessage = restore(context.message, tokens);

    // Clean up stored tokens
    this.tokenStore.delete(turnId);

    return {
      message: restoredMessage,
      metadata: context.metadata,
    };
  }

  async toolCallHook(context: OpenClawHookContext): Promise<OpenClawHookResult> {
    // Sanitize tool parameters the same as pre-LLM
    return await this.preLLMHook(context);
  }

  getStoredTokens(turnId: string): RedactionToken[] | undefined {
    return this.tokenStore.get(turnId);
  }

  clearTokenStore(): void {
    this.tokenStore.clear();
  }

  private isExcludedAgent(agentId?: string): boolean {
    if (!agentId) return false;
    return this.config.config.excludeAgents.includes(agentId);
  }
}

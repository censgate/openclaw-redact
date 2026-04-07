import type {
  OpenClawHookContext,
  OpenClawHookResult,
  PluginConfig,
  RedactionToken,
} from "./types.js";
import { resolveConfig } from "./config.js";
import { redact } from "./redactor.js";
import { restore } from "./restorer.js";

export class OpenClawRedactPlugin {
  private config: PluginConfig;
  private tokenStore: Map<string, RedactionToken[]> = new Map();

  constructor(userConfig?: Partial<PluginConfig>) {
    this.config = resolveConfig(userConfig);
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  preLLMHook(context: OpenClawHookContext): OpenClawHookResult {
    if (!this.config.enabled) {
      return { message: context.message, metadata: context.metadata };
    }

    if (this.isExcludedAgent(context.agentId)) {
      return { message: context.message, metadata: context.metadata };
    }

    const result = redact(context.message, {
      mode: this.config.config.mode,
      entities: this.config.config.entities,
      customPatterns: this.config.config.customPatterns,
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

  postLLMHook(context: OpenClawHookContext): OpenClawHookResult {
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

  toolCallHook(context: OpenClawHookContext): OpenClawHookResult {
    // Sanitize tool parameters the same as pre-LLM
    return this.preLLMHook(context);
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

import type {
  HttpBackendConfig,
  OpenClawHookContext,
  OpenClawHookResult,
  PluginConfig,
  PluginConfigInput,
  RedactionToken,
} from "./types.js";
import { resolveConfig } from "./config.js";
import { redact } from "./redactor.js";
import { restore } from "./restorer.js";
import {
  DockerBackendBootstrapper,
  type BackendBootstrapper,
} from "./docker-bootstrap.js";
import { RedactHttpClient } from "./http-client.js";

export class OpenClawRedactPlugin {
  private config: PluginConfig;
  private tokenStore: Map<string, RedactionToken[]> = new Map();
  private fetchImpl?: typeof fetch;
  private backendBootstrapper: BackendBootstrapper;
  private backendBootstrapped = false;
  private backendBootstrapPromise?: Promise<void>;

  constructor(
    userConfig?: PluginConfigInput,
    options?: {
      fetchImpl?: typeof fetch;
      backendBootstrapper?: BackendBootstrapper;
    },
  ) {
    this.config = resolveConfig(userConfig);
    this.fetchImpl = options?.fetchImpl;
    this.backendBootstrapper =
      options?.backendBootstrapper ?? new DockerBackendBootstrapper();
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

    const result = await this.redactWithBootstrap(context.message);

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

  private async redactWithBootstrap(message: string) {
    try {
      return await redact(message, {
        mode: this.config.config.mode,
        http: this.config.config.http,
        fetchImpl: this.fetchImpl,
      });
    } catch (error) {
      if (!this.shouldAttemptDockerBootstrap(error)) {
        throw error;
      }

      await this.ensureBackendBootstrapped();
      return await redact(message, {
        mode: this.config.config.mode,
        http: this.config.config.http,
        fetchImpl: this.fetchImpl,
      });
    }
  }

  private shouldAttemptDockerBootstrap(error: unknown): boolean {
    const dockerConfig = this.config.config.http.docker;
    if (!dockerConfig?.enabled || this.backendBootstrapped) {
      return false;
    }

    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("eai_again") ||
      message.includes("timed out")
    );
  }

  private async ensureBackendBootstrapped(): Promise<void> {
    if (this.backendBootstrapped) {
      return;
    }

    if (!this.backendBootstrapPromise) {
      this.backendBootstrapPromise = this.bootstrapAndWaitForReadiness();
    }

    await this.backendBootstrapPromise;
    this.backendBootstrapped = true;
  }

  private async bootstrapAndWaitForReadiness(): Promise<void> {
    const httpConfig = this.config.config.http;
    const dockerConfig = httpConfig.docker;
    if (!dockerConfig?.enabled) {
      return;
    }

    try {
      const bootstrapResult = await this.backendBootstrapper.ensureRunning(httpConfig);
      if (bootstrapResult.endpoint && bootstrapResult.endpoint !== httpConfig.endpoint) {
        this.config = {
          ...this.config,
          config: {
            ...this.config.config,
            http: {
              ...this.config.config.http,
              endpoint: bootstrapResult.endpoint,
            },
          },
        };
      }
      await this.waitForBackendReadiness(this.config.config.http);
    } finally {
      this.backendBootstrapPromise = undefined;
    }
  }

  private async waitForBackendReadiness(
    httpConfig: HttpBackendConfig,
  ): Promise<void> {
    const dockerConfig = httpConfig.docker;
    if (!dockerConfig?.enabled) {
      return;
    }

    const deadline = Date.now() + dockerConfig.startupTimeoutMs;
    const client = new RedactHttpClient(httpConfig, this.fetchImpl);
    let lastError: unknown;

    while (Date.now() < deadline) {
      try {
        await client.analyze("health");
        return;
      } catch (error) {
        lastError = error;
        await sleep(dockerConfig.startupProbeIntervalMs);
      }
    }

    throw new Error(
      `Redact backend did not become ready within ${dockerConfig.startupTimeoutMs}ms. Last error: ${stringifyError(lastError)}`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

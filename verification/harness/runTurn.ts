import { randomUUID } from "node:crypto";
import type { OpenClawRedactPlugin } from "../../src/plugin.js";
import { AuditChain } from "./auditChain.js";

export interface MockLlm {
  (redactedPrompt: string): Promise<string>;
}

export interface RunTurnResult {
  preMessage: string;
  llmReceived: string;
  assistantOut: string;
  finalUserFacing: string;
  turnId: string;
  redactionCount: number;
  audit: AuditChain;
}

/**
 * Simulates gateway flow: preLLM → mock LLM → postLLM with audit events.
 */
export async function runConversationTurn(
  plugin: OpenClawRedactPlugin,
  userMessage: string,
  mockLlm: MockLlm,
  options?: { turnId?: string },
): Promise<RunTurnResult> {
  const audit = new AuditChain();
  const turnId = options?.turnId ?? randomUUID();

  audit.record("preLLM:input", { message: userMessage, turnId });
  const pre = await plugin.preLLMHook({
    message: userMessage,
    metadata: { turnId },
  });
  audit.record("preLLM:output", {
    message: pre.message,
    metadata: pre.metadata,
  });

  const llmReceived = pre.message;
  const assistantRaw = await mockLlm(llmReceived);
  audit.record("mockLlm:output", { message: assistantRaw });

  const post = await plugin.postLLMHook({
    message: assistantRaw,
    metadata: pre.metadata ?? { turnId },
  });
  audit.record("postLLM:output", {
    message: post.message,
    metadata: post.metadata,
  });

  const redactionCount =
    typeof pre.metadata?.redactionCount === "number"
      ? pre.metadata.redactionCount
      : 0;

  return {
    preMessage: userMessage,
    llmReceived,
    assistantOut: assistantRaw,
    finalUserFacing: post.message,
    turnId: (pre.metadata?.turnId as string) ?? turnId,
    redactionCount,
    audit,
  };
}

/**
 * Tool-call path: same redaction as pre-LLM (see plugin.toolCallHook).
 */
export async function runToolCall(
  plugin: OpenClawRedactPlugin,
  toolPayload: string,
  options?: { agentId?: string; turnId?: string },
): Promise<{ redacted: string; audit: AuditChain }> {
  const audit = new AuditChain();
  audit.record("toolCall:input", { message: toolPayload });
  const out = await plugin.toolCallHook({
    message: toolPayload,
    agentId: options?.agentId,
    metadata: options?.turnId ? { turnId: options.turnId } : {},
  });
  audit.record("toolCall:output", { message: out.message, metadata: out.metadata });
  return { redacted: out.message, audit };
}

import { z } from "zod";
import { buildPluginConfigSchema } from "openclaw/plugin-sdk/plugin-entry";

/**
 * Docker automation options (optional overrides; disabled unless explicitly enabled).
 */
const dockerConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    image: z.string().optional(),
    containerName: z.string().optional(),
    host: z.string().optional(),
    hostPort: z.number().int().optional(),
    containerPort: z.number().int().optional(),
    pull: z.boolean().optional(),
    restartOnFailure: z.boolean().optional(),
    startupTimeoutMs: z.number().int().optional(),
    startupProbeIntervalMs: z.number().int().optional(),
  })
  .passthrough();

/**
 * HTTP client + backend options for the Redact API.
 */
const httpConfigSchema = z
  .object({
    endpoint: z.string().optional(),
    timeoutMs: z.number().optional(),
    language: z.string().optional(),
    entityTypes: z.array(z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    docker: dockerConfigSchema.optional(),
  })
  .passthrough();

/**
 * Inner plugin config: either nested under `config` in openclaw.json or passed flat as `api.pluginConfig`.
 */
const innerPluginConfigSchema = z
  .object({
    mode: z.enum(["reversible", "irreversible", "audit-only"]).optional(),
    excludeAgents: z.array(z.string()).optional(),
    logRedactions: z.boolean().optional(),
    http: httpConfigSchema.optional(),
  })
  .passthrough();

/**
 * Shape accepted by `resolveConfig`: openclaw.json entry (`enabled` + `config`) and/or flat inner fields.
 */
export const pluginConfigInputZodSchema = z
  .object({
    enabled: z.boolean().optional(),
    config: innerPluginConfigSchema.optional(),
    mode: z.enum(["reversible", "irreversible", "audit-only"]).optional(),
    excludeAgents: z.array(z.string()).optional(),
    logRedactions: z.boolean().optional(),
    http: httpConfigSchema.optional(),
  })
  .passthrough();

const uiHints: Record<string, { label?: string; help?: string; advanced?: boolean }> = {
  mode: {
    label: "Redaction mode",
    help: "reversible: restore placeholders after the model runs; irreversible: no restoration; audit-only: detection path only.",
  },
  excludeAgents: {
    label: "Exclude agents",
    help: "Agent ids that skip redaction when configured in the plugin runtime.",
    advanced: true,
  },
  logRedactions: {
    label: "Log redactions",
    help: "May log sensitive content; keep off in production unless the sink is compliant.",
    advanced: true,
  },
  "http.endpoint": {
    label: "Redact API base URL",
    help: "Overrides REDACT_API_ENDPOINT (default http://127.0.0.1:8080).",
  },
  "http.timeoutMs": {
    label: "HTTP timeout (ms)",
    advanced: true,
  },
  "http.language": {
    label: "Analyze language",
    advanced: true,
  },
  "http.entityTypes": {
    label: "Entity types",
    help: "Optional filter; mirrors comma-separated REDACT_ENTITY_TYPES.",
    advanced: true,
  },
  "http.headers": {
    label: "Extra HTTP headers",
    advanced: true,
  },
  "http.docker.enabled": {
    label: "Docker auto-start",
    help: "Opt-in only. When true, may run Docker to start the Redact container. Overrides REDACT_DOCKER_AUTOSTART.",
    advanced: true,
  },
  "http.docker.image": {
    label: "Docker image",
    help: "Overrides REDACT_DOCKER_IMAGE.",
    advanced: true,
  },
};

/** OpenClaw plugin config schema (safeParse + jsonSchema for UIs / registry). */
export const censgateRedactPluginConfigSchema = buildPluginConfigSchema(
  pluginConfigInputZodSchema,
  { uiHints },
);

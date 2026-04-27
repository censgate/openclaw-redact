#!/usr/bin/env node
/**
 * After `npm run build`, copy the generated JSON Schema (and optional uiHints)
 * from dist/config-schema.js into openclaw.plugin.json so the registry manifest
 * matches runtime `definePluginEntry` configSchema.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pluginPath = resolve(root, "openclaw.plugin.json");
const schemaPath = resolve(root, "dist/config-schema.js");

let censgateRedactPluginConfigSchema;
try {
  ({ censgateRedactPluginConfigSchema } = await import(schemaPath));
} catch (err) {
  console.error(
    "sync-openclaw-plugin-json-schema: import dist/config-schema.js failed. Run `npm run build` first.",
  );
  throw err;
}

const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
const { jsonSchema, uiHints } = censgateRedactPluginConfigSchema;

if (!jsonSchema || typeof jsonSchema !== "object") {
  throw new Error("censgateRedactPluginConfigSchema.jsonSchema missing");
}

const registryDescription =
  "OpenClaw plugins.entries.censgate-redact shape. No required environment variables. " +
  "Optional REDACT_* overrides: REDACT_API_ENDPOINT, REDACT_ENTITY_TYPES, REDACT_DOCKER_AUTOSTART, " +
  "REDACT_DOCKER_IMAGE, REDACT_DOCKER_CONTAINER_NAME, REDACT_DOCKER_HOST, REDACT_DOCKER_HOST_PORT, " +
  "REDACT_DOCKER_CONTAINER_PORT, REDACT_DOCKER_PULL, REDACT_DOCKER_RESTART_ON_FAILURE, " +
  "REDACT_DOCKER_STARTUP_TIMEOUT_MS, REDACT_DOCKER_STARTUP_PROBE_INTERVAL_MS. Docker auto-start is disabled by default and must be explicitly enabled. " +
  "This plugin does not read REDACT_ENCRYPTION_KEY or REDACT_PERFORMANCE_MODE.";

plugin.configSchema = {
  jsonSchema: {
    description: registryDescription,
    ...jsonSchema,
  },
  ...(uiHints && Object.keys(uiHints).length > 0 ? { uiHints } : {}),
};

writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`, "utf8");
console.log("Updated openclaw.plugin.json configSchema from dist/config-schema.js");

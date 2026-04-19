import { OpenClawRedactPlugin } from "../../src/plugin.js";
import type { PluginConfigInput } from "../../src/types.js";
import { getVerifyEndpoint } from "../endpoint.js";

export type SensitivityProfile = "standard" | "hipaa" | "none";

/** Narrow recognizer set for "hipaa" profile (core PII; expand as redact-api adds types). */
const HIPAA_ENTITY_TYPES: string[] = [
  "US_SSN",
  "EMAIL_ADDRESS",
  "PHONE_NUMBER",
];

/**
 * Builds plugin config for verification: Docker autostart off, fixed HTTP endpoint.
 */
export function createVerificationPlugin(
  profile: SensitivityProfile,
): OpenClawRedactPlugin {
  const endpoint = getVerifyEndpoint();
  const userConfig: PluginConfigInput = {
    enabled: profile !== "none",
    config: {
      mode: "reversible",
      excludeAgents: [],
      logRedactions: false,
      http: {
        endpoint,
        timeoutMs: 30_000,
        language: "en",
        entityTypes:
          profile === "hipaa" ? [...HIPAA_ENTITY_TYPES] : undefined,
        docker: {
          enabled: false,
          image: "ghcr.io/censgate/redact:full",
          containerName: "verify-redact",
          host: "127.0.0.1",
          containerPort: 8080,
          pull: false,
          restartOnFailure: false,
          startupTimeoutMs: 30_000,
          startupProbeIntervalMs: 500,
        },
      },
    },
  };
  return new OpenClawRedactPlugin(userConfig);
}

import type {
  HttpBackendConfig,
  PluginConfig,
  PluginConfigInput,
  RedactionMode,
} from "./types.js";

const DEFAULT_HTTP_CONFIG: HttpBackendConfig = {
  endpoint: process.env.REDACT_API_ENDPOINT ?? "http://127.0.0.1:8080",
  timeoutMs: 1500,
  language: "en",
};

const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  config: {
    mode: "reversible",
    excludeAgents: [],
    logRedactions: false,
    http: DEFAULT_HTTP_CONFIG,
  },
};

export function resolveConfig(
  userConfig?: PluginConfigInput,
): PluginConfig {
  if (!userConfig) {
    return {
      enabled: DEFAULT_CONFIG.enabled,
      config: {
        ...DEFAULT_CONFIG.config,
        http: { ...DEFAULT_CONFIG.config.http },
      },
    };
  }

  return {
    enabled: userConfig.enabled ?? DEFAULT_CONFIG.enabled,
    config: {
      mode:
        (userConfig.config?.mode as RedactionMode) ??
        DEFAULT_CONFIG.config.mode,
      excludeAgents:
        (userConfig.config?.excludeAgents as string[]) ??
        DEFAULT_CONFIG.config.excludeAgents,
      logRedactions:
        userConfig.config?.logRedactions ?? DEFAULT_CONFIG.config.logRedactions,
      http: {
        endpoint:
          userConfig.config?.http?.endpoint ?? DEFAULT_CONFIG.config.http.endpoint,
        timeoutMs:
          userConfig.config?.http?.timeoutMs ?? DEFAULT_CONFIG.config.http.timeoutMs,
        language:
          userConfig.config?.http?.language ?? DEFAULT_CONFIG.config.http.language,
        entityTypes:
          userConfig.config?.http?.entityTypes ??
          DEFAULT_CONFIG.config.http.entityTypes,
        headers:
          userConfig.config?.http?.headers ?? DEFAULT_CONFIG.config.http.headers,
      },
    },
  };
}

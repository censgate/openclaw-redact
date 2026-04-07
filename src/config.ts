import type {
  DockerAutomationConfig,
  HttpBackendConfig,
  PluginConfig,
  PluginConfigInput,
  RedactionMode,
} from "./types.js";

const DEFAULT_DOCKER_CONFIG: DockerAutomationConfig = {
  enabled: parseBoolean(process.env.REDACT_DOCKER_AUTOSTART, false),
  image: process.env.REDACT_DOCKER_IMAGE ?? "ghcr.io/censgate/redact:full",
  containerName: process.env.REDACT_DOCKER_CONTAINER_NAME ?? "openclaw-redact-api",
  host: process.env.REDACT_DOCKER_HOST ?? "127.0.0.1",
  hostPort: parseOptionalInteger(process.env.REDACT_DOCKER_HOST_PORT),
  containerPort: parseInteger(process.env.REDACT_DOCKER_CONTAINER_PORT, 8080),
  pull: parseBoolean(process.env.REDACT_DOCKER_PULL, false),
  startupTimeoutMs: parseInteger(
    process.env.REDACT_DOCKER_STARTUP_TIMEOUT_MS,
    30000,
  ),
  startupProbeIntervalMs: parseInteger(
    process.env.REDACT_DOCKER_STARTUP_PROBE_INTERVAL_MS,
    500,
  ),
};

const DEFAULT_HTTP_CONFIG: HttpBackendConfig = {
  endpoint: process.env.REDACT_API_ENDPOINT ?? "http://127.0.0.1:8080",
  timeoutMs: 1500,
  language: "en",
  docker: DEFAULT_DOCKER_CONFIG,
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
        docker: {
          enabled:
            userConfig.config?.http?.docker?.enabled ??
            DEFAULT_CONFIG.config.http.docker?.enabled ??
            false,
          image:
            userConfig.config?.http?.docker?.image ??
            DEFAULT_CONFIG.config.http.docker?.image ??
            DEFAULT_DOCKER_CONFIG.image,
          containerName:
            userConfig.config?.http?.docker?.containerName ??
            DEFAULT_CONFIG.config.http.docker?.containerName ??
            DEFAULT_DOCKER_CONFIG.containerName,
          host:
            userConfig.config?.http?.docker?.host ??
            DEFAULT_CONFIG.config.http.docker?.host ??
            DEFAULT_DOCKER_CONFIG.host,
          hostPort:
            userConfig.config?.http?.docker?.hostPort ??
            DEFAULT_CONFIG.config.http.docker?.hostPort ??
            DEFAULT_DOCKER_CONFIG.hostPort,
          containerPort:
            userConfig.config?.http?.docker?.containerPort ??
            DEFAULT_CONFIG.config.http.docker?.containerPort ??
            DEFAULT_DOCKER_CONFIG.containerPort,
          pull:
            userConfig.config?.http?.docker?.pull ??
            DEFAULT_CONFIG.config.http.docker?.pull ??
            DEFAULT_DOCKER_CONFIG.pull,
          startupTimeoutMs:
            userConfig.config?.http?.docker?.startupTimeoutMs ??
            DEFAULT_CONFIG.config.http.docker?.startupTimeoutMs ??
            DEFAULT_DOCKER_CONFIG.startupTimeoutMs,
          startupProbeIntervalMs:
            userConfig.config?.http?.docker?.startupProbeIntervalMs ??
            DEFAULT_CONFIG.config.http.docker?.startupProbeIntervalMs ??
            DEFAULT_DOCKER_CONFIG.startupProbeIntervalMs,
        },
      },
    },
  };
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

import type {
  EntityCategory,
  EntityPattern,
  PluginConfig,
  RedactionMode,
} from "./types.js";

const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  config: {
    mode: "reversible",
    entities: ["pii", "credentials", "financial"],
    customPatterns: [],
    excludeAgents: [],
    logRedactions: false,
  },
};

export function resolveConfig(
  userConfig?: Partial<PluginConfig>,
): PluginConfig {
  if (!userConfig) return { ...DEFAULT_CONFIG };

  return {
    enabled: userConfig.enabled ?? DEFAULT_CONFIG.enabled,
    config: {
      mode:
        (userConfig.config?.mode as RedactionMode) ??
        DEFAULT_CONFIG.config.mode,
      entities:
        (userConfig.config?.entities as EntityCategory[]) ??
        DEFAULT_CONFIG.config.entities,
      customPatterns:
        (userConfig.config?.customPatterns as EntityPattern[]) ??
        DEFAULT_CONFIG.config.customPatterns,
      excludeAgents:
        (userConfig.config?.excludeAgents as string[]) ??
        DEFAULT_CONFIG.config.excludeAgents,
      logRedactions:
        userConfig.config?.logRedactions ?? DEFAULT_CONFIG.config.logRedactions,
    },
  };
}

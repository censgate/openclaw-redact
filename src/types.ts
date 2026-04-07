export type RedactionMode = "reversible" | "irreversible" | "audit-only";

export type EntityCategory =
  | "pii"
  | "credentials"
  | "financial"
  | "healthcare"
  | "location"
  | "custom";

export interface EntityPattern {
  name: string;
  category: EntityCategory;
  pattern: RegExp;
  description?: string;
}

export interface DetectedEntity {
  type: string;
  category: EntityCategory;
  value: string;
  start: number;
  end: number;
}

export interface RedactionToken {
  id: string;
  type: string;
  category: EntityCategory;
  placeholder: string;
  originalValue?: string;
}

export interface RedactionResult {
  redactedText: string;
  tokens: RedactionToken[];
  entityCount: number;
}

export interface DetectionResult {
  entities: DetectedEntity[];
  entityCount: number;
}

export interface RedactOptions {
  mode?: RedactionMode;
  entities?: EntityCategory[];
  customPatterns?: EntityPattern[];
  excludePatterns?: string[];
}

export interface PluginConfig {
  enabled: boolean;
  config: {
    mode: RedactionMode;
    entities: EntityCategory[];
    customPatterns: EntityPattern[];
    excludeAgents: string[];
    logRedactions: boolean;
  };
}

export interface OpenClawHookContext {
  agentId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface OpenClawHookResult {
  message: string;
  metadata?: Record<string, unknown>;
}

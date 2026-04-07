export type RedactionMode = "reversible" | "irreversible" | "audit-only";

export type EntityCategory =
  | "pii"
  | "financial"
  | "healthcare"
  | "location"
  | "credentials"
  | "unknown";

export interface DetectedEntity {
  type: string;
  category: EntityCategory;
  value: string;
  start: number;
  end: number;
  score?: number;
  recognizerName?: string;
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
  processingTimeMs?: number;
}

export interface HttpBackendConfig {
  endpoint: string;
  timeoutMs: number;
  language: string;
  entityTypes?: string[];
  headers?: Record<string, string>;
  docker?: DockerAutomationConfig;
}

export interface DockerAutomationConfig {
  enabled: boolean;
  image: string;
  containerName: string;
  host: string;
  hostPort?: number;
  containerPort: number;
  pull: boolean;
  startupTimeoutMs: number;
  startupProbeIntervalMs: number;
}

export interface DetectOptions {
  http: HttpBackendConfig;
  fetchImpl?: typeof fetch;
}

export interface RedactOptions extends DetectOptions {
  mode?: RedactionMode;
}

export interface PluginConfig {
  enabled: boolean;
  config: {
    mode: RedactionMode;
    excludeAgents: string[];
    logRedactions: boolean;
    http: HttpBackendConfig;
  };
}

export interface PluginConfigInput {
  enabled?: boolean;
  config?: {
    mode?: RedactionMode;
    excludeAgents?: string[];
    logRedactions?: boolean;
    http?: Omit<Partial<HttpBackendConfig>, "docker"> & {
      docker?: Partial<DockerAutomationConfig>;
    };
  };
}

export interface RedactApiAnalyzeRequest {
  text: string;
  language?: string;
  entities?: string[];
}

export interface RedactApiAnalyzeItem {
  entity_type: string;
  start: number;
  end: number;
  score: number;
  text?: string;
  recognizer_name?: string;
}

export interface RedactApiAnalyzeResponse {
  results: RedactApiAnalyzeItem[];
  metadata?: {
    processing_time_ms?: number;
    recognizers_used?: number;
    language?: string;
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

import type {
  HttpBackendConfig,
  RedactApiAnalyzeRequest,
  RedactApiAnalyzeResponse,
} from "./types.js";

export class RedactHttpClient {
  private readonly config: HttpBackendConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpBackendConfig, fetchImpl?: typeof fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl ?? fetch;
  }

  async analyze(text: string): Promise<RedactApiAnalyzeResponse> {
    const payload: RedactApiAnalyzeRequest = {
      text,
      language: this.config.language,
    };

    if (this.config.entityTypes && this.config.entityTypes.length > 0) {
      payload.entities = this.config.entityTypes;
    }

    return this.postJson<RedactApiAnalyzeResponse>("/api/v1/analyze", payload);
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const url = buildUrl(this.config.endpoint, path);

    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.config.headers ?? {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw = await response.text();
      if (!response.ok) {
        throw new Error(
          `Redact API request failed (${response.status}): ${raw || "empty response body"}`,
        );
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Redact API request timed out after ${this.config.timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildUrl(base: string, path: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase).toString();
}

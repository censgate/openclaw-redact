import type {
  DetectedEntity,
  DetectOptions,
  DetectionResult,
  EntityCategory,
} from "./types.js";
import { RedactHttpClient } from "./http-client.js";

export async function detect(
  text: string,
  options: DetectOptions,
): Promise<DetectionResult> {
  const client = new RedactHttpClient(options.http, options.fetchImpl);
  const analysis = await client.analyze(text);
  const entities: DetectedEntity[] = analysis.results.map((item) => ({
    type: item.entity_type,
    category: mapCategory(item.entity_type),
    value: item.text ?? text.slice(item.start, item.end),
    start: item.start,
    end: item.end,
    score: item.score,
    recognizerName: item.recognizer_name,
  }));

  // Sort by position, longer matches first for overlapping
  entities.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping entities (keep the first/longer match)
  const filtered = removeOverlaps(entities);

  return {
    entities: filtered,
    entityCount: filtered.length,
    processingTimeMs: analysis.metadata?.processing_time_ms,
  };
}

function mapCategory(entityType: string): EntityCategory {
  const normalized = entityType.toUpperCase();

  if (
    normalized.includes("CARD") ||
    normalized.includes("BANK") ||
    normalized.includes("IBAN") ||
    normalized.includes("CRYPTO") ||
    normalized.includes("BTC") ||
    normalized.includes("ETH")
  ) {
    return "financial";
  }

  if (
    normalized.includes("MEDICAL") ||
    normalized.includes("NHS") ||
    normalized.includes("NINO")
  ) {
    return "healthcare";
  }

  if (
    normalized.includes("PERSON") ||
    normalized.includes("ORGANIZATION") ||
    normalized.includes("LOCATION") ||
    normalized.includes("POSTCODE") ||
    normalized.includes("ZIP")
  ) {
    return "location";
  }

  if (
    normalized.includes("EMAIL") ||
    normalized.includes("PHONE") ||
    normalized.includes("PASSPORT") ||
    normalized.includes("SSN")
  ) {
    return "pii";
  }

  if (
    normalized.includes("TOKEN") ||
    normalized.includes("KEY") ||
    normalized.includes("HASH")
  ) {
    return "credentials";
  }

  return "unknown";
}

function removeOverlaps(entities: DetectedEntity[]): DetectedEntity[] {
  if (entities.length === 0) return entities;

  const result: DetectedEntity[] = [entities[0]];

  for (let i = 1; i < entities.length; i++) {
    const prev = result[result.length - 1];
    const curr = entities[i];

    if (curr.start >= prev.end) {
      result.push(curr);
    }
  }

  return result;
}

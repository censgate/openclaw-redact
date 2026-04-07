import type {
  DetectedEntity,
  DetectionResult,
  EntityCategory,
  EntityPattern,
} from "./types.js";
import { getAllPatterns, getPatterns } from "./patterns/index.js";

export function detect(
  text: string,
  categories?: EntityCategory[],
  customPatterns?: EntityPattern[],
): DetectionResult {
  const patterns = categories ? getPatterns(categories) : getAllPatterns();
  const allPatterns = customPatterns
    ? [...patterns, ...customPatterns]
    : patterns;

  const entities: DetectedEntity[] = [];

  for (const entityPattern of allPatterns) {
    const regex = new RegExp(entityPattern.pattern.source, entityPattern.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type: entityPattern.name,
        category: entityPattern.category,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Sort by position, longer matches first for overlapping
  entities.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping entities (keep the first/longer match)
  const filtered = removeOverlaps(entities);

  return {
    entities: filtered,
    entityCount: filtered.length,
  };
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

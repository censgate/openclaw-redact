import { v4 as uuidv4 } from "uuid";
import type {
  RedactOptions,
  RedactionMode,
  RedactionResult,
  RedactionToken,
} from "./types.js";
import { detect } from "./detector.js";

export function redact(
  text: string,
  options: RedactOptions = {},
): RedactionResult {
  const mode: RedactionMode = options.mode ?? "reversible";
  const entities = options.entities;
  const customPatterns = options.customPatterns;

  const detection = detect(text, entities, customPatterns);

  if (detection.entityCount === 0) {
    return { redactedText: text, tokens: [], entityCount: 0 };
  }

  const tokens: RedactionToken[] = [];
  let redactedText = "";
  let lastIndex = 0;

  for (const entity of detection.entities) {
    redactedText += text.slice(lastIndex, entity.start);

    const token = createToken(entity.type, entity.category, entity.value, mode);
    tokens.push(token);
    redactedText += token.placeholder;

    lastIndex = entity.end;
  }

  redactedText += text.slice(lastIndex);

  return {
    redactedText,
    tokens,
    entityCount: tokens.length,
  };
}

function createToken(
  type: string,
  category: string,
  originalValue: string,
  mode: RedactionMode,
): RedactionToken {
  const id = uuidv4();

  if (mode === "reversible") {
    return {
      id,
      type,
      category: category as RedactionToken["category"],
      placeholder: `[REDACTED:${category}_${type}:${id}]`,
      originalValue,
    };
  }

  // Irreversible or audit-only: no original value stored in token
  return {
    id,
    type,
    category: category as RedactionToken["category"],
    placeholder:
      mode === "audit-only"
        ? originalValue
        : `[REDACTED:${category}_${type}]`,
  };
}

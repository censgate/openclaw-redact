import type { RedactionToken } from "./types.js";

export function restore(text: string, tokens: RedactionToken[]): string {
  let restored = text;

  for (const token of tokens) {
    if (!token.originalValue) {
      continue; // Irreversible tokens cannot be restored
    }
    restored = restored.replaceAll(token.placeholder, token.originalValue);
  }

  return restored;
}

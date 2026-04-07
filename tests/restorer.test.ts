import { describe, it, expect } from "vitest";
import { redact } from "../src/redactor.js";
import { restore } from "../src/restorer.js";

describe("restore", () => {
  it("restores reversible redactions", () => {
    const original = "Contact john@example.com for details";
    const result = redact(original, { mode: "reversible" });
    const restored = restore(result.redactedText, result.tokens);
    expect(restored).toBe(original);
  });

  it("does not restore irreversible redactions", () => {
    const result = redact("Contact john@example.com", {
      mode: "irreversible",
    });
    const restored = restore(result.redactedText, result.tokens);
    expect(restored).toContain("[REDACTED:");
    expect(restored).not.toContain("john@example.com");
  });

  it("restores multiple redacted entities", () => {
    const original = "Email: user@test.com, SSN: 123-45-6789";
    const result = redact(original, { mode: "reversible", entities: ["pii"] });
    const restored = restore(result.redactedText, result.tokens);
    expect(restored).toBe(original);
  });

  it("handles text with no tokens", () => {
    const restored = restore("Hello world", []);
    expect(restored).toBe("Hello world");
  });
});

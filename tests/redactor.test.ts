import { describe, it, expect } from "vitest";
import { redact } from "../src/redactor.js";

describe("redact", () => {
  it("redacts emails in reversible mode", () => {
    const result = redact("Send to john@example.com", { mode: "reversible" });
    expect(result.redactedText).not.toContain("john@example.com");
    expect(result.redactedText).toMatch(/\[REDACTED:pii_email:[a-f0-9-]+\]/);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].originalValue).toBe("john@example.com");
  });

  it("redacts emails in irreversible mode", () => {
    const result = redact("Send to john@example.com", {
      mode: "irreversible",
    });
    expect(result.redactedText).toContain("[REDACTED:pii_email]");
    expect(result.tokens[0].originalValue).toBeUndefined();
  });

  it("preserves original text in audit-only mode", () => {
    const result = redact("Send to john@example.com", { mode: "audit-only" });
    expect(result.redactedText).toBe("Send to john@example.com");
    expect(result.entityCount).toBe(1);
  });

  it("returns unchanged text when no entities found", () => {
    const result = redact("Hello world");
    expect(result.redactedText).toBe("Hello world");
    expect(result.tokens).toHaveLength(0);
    expect(result.entityCount).toBe(0);
  });

  it("redacts multiple entities", () => {
    const text = "Email: user@test.com, SSN: 123-45-6789";
    const result = redact(text, { mode: "reversible", entities: ["pii"] });
    expect(result.redactedText).not.toContain("user@test.com");
    expect(result.redactedText).not.toContain("123-45-6789");
    expect(result.entityCount).toBeGreaterThanOrEqual(2);
  });

  it("filters by entity category", () => {
    const text = "Email: user@test.com, Key: AKIAIOSFODNN7EXAMPLE";
    const result = redact(text, { entities: ["pii"] });
    expect(result.redactedText).not.toContain("user@test.com");
    // credentials should still be present when only filtering pii
    expect(result.redactedText).toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("defaults to reversible mode", () => {
    const result = redact("Send to john@example.com");
    expect(result.redactedText).toMatch(/\[REDACTED:pii_email:[a-f0-9-]+\]/);
  });
});

import { describe, it, expect } from "vitest";
import { restore } from "../src/restorer.js";
import type { RedactionToken } from "../src/types.js";

describe("restore", () => {
  it("restores reversible redactions", () => {
    const tokens: RedactionToken[] = [
      {
        id: "1",
        type: "EMAIL_ADDRESS",
        category: "pii",
        placeholder: "[REDACTED:EMAIL_ADDRESS:1]",
        originalValue: "john@example.com",
      },
    ];
    const restored = restore("Contact [REDACTED:EMAIL_ADDRESS:1] for details", tokens);
    expect(restored).toBe("Contact john@example.com for details");
  });

  it("does not restore irreversible redactions", () => {
    const tokens: RedactionToken[] = [
      {
        id: "2",
        type: "EMAIL_ADDRESS",
        category: "pii",
        placeholder: "[REDACTED:EMAIL_ADDRESS]",
      },
    ];
    const restored = restore("Contact [REDACTED:EMAIL_ADDRESS]", tokens);
    expect(restored).toContain("[REDACTED:EMAIL_ADDRESS]");
    expect(restored).not.toContain("john@example.com");
  });

  it("restores multiple redacted entities", () => {
    const tokens: RedactionToken[] = [
      {
        id: "3",
        type: "EMAIL_ADDRESS",
        category: "pii",
        placeholder: "[REDACTED:EMAIL_ADDRESS:3]",
        originalValue: "user@test.com",
      },
      {
        id: "4",
        type: "US_SSN",
        category: "pii",
        placeholder: "[REDACTED:US_SSN:4]",
        originalValue: "123-45-6789",
      },
    ];
    const restored = restore(
      "Email: [REDACTED:EMAIL_ADDRESS:3], SSN: [REDACTED:US_SSN:4]",
      tokens,
    );
    expect(restored).toBe("Email: user@test.com, SSN: 123-45-6789");
  });

  it("handles text with no tokens", () => {
    const restored = restore("Hello world", []);
    expect(restored).toBe("Hello world");
  });
});

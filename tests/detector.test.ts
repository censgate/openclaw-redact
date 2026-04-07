import { describe, it, expect } from "vitest";
import { detect } from "../src/detector.js";

describe("detect", () => {
  it("detects email addresses", () => {
    const result = detect("Contact me at john@example.com please", ["pii"]);
    expect(result.entityCount).toBe(1);
    expect(result.entities[0].type).toBe("email");
    expect(result.entities[0].value).toBe("john@example.com");
  });

  it("detects SSNs", () => {
    const result = detect("SSN: 123-45-6789", ["pii"]);
    expect(result.entities.some((e) => e.type === "ssn")).toBe(true);
  });

  it("detects credit card numbers", () => {
    const result = detect(
      "Card: 4111 1111 1111 1111",
      ["financial"],
    );
    expect(result.entityCount).toBeGreaterThan(0);
  });

  it("detects AWS access keys", () => {
    const result = detect("Key: AKIAIOSFODNN7EXAMPLE", ["credentials"]);
    expect(result.entities.some((e) => e.type === "aws_access_key")).toBe(true);
  });

  it("detects GitHub tokens", () => {
    const result = detect(
      "Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk",
      ["credentials"],
    );
    expect(result.entities.some((e) => e.type === "github_token")).toBe(true);
  });

  it("detects medical record numbers", () => {
    const result = detect("MRN: 12345678", ["healthcare"]);
    expect(result.entities.some((e) => e.type === "mrn")).toBe(true);
  });

  it("detects multiple entity types", () => {
    const text =
      "Email: user@test.com, SSN: 999-88-7777, Key: AKIAIOSFODNN7EXAMPLE";
    const result = detect(text, ["pii", "credentials"]);
    expect(result.entityCount).toBeGreaterThanOrEqual(3);
  });

  it("returns empty results for clean text", () => {
    const result = detect("Hello world, this is a test.", ["pii"]);
    expect(result.entityCount).toBe(0);
    expect(result.entities).toHaveLength(0);
  });

  it("supports custom patterns", () => {
    const result = detect("Order ID: ORD-12345", [], [
      {
        name: "order_id",
        category: "custom",
        pattern: /ORD-\d{5}/g,
        description: "Order IDs",
      },
    ]);
    expect(result.entityCount).toBe(1);
    expect(result.entities[0].type).toBe("order_id");
  });

  it("supports custom patterns without global flag", () => {
    const result = detect("Order IDs: ORD-12345 and ORD-67890", [], [
      {
        name: "order_id",
        category: "custom",
        pattern: /ORD-\d{5}/,
        description: "Order IDs",
      },
    ]);
    expect(result.entityCount).toBe(2);
    expect(result.entities[0].value).toBe("ORD-12345");
    expect(result.entities[1].value).toBe("ORD-67890");
  });
});

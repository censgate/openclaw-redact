import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AuditChain } from "./harness/auditChain.js";
import { isRedactAnalyzeResponse } from "./validateAnalyzeResponse.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("Automated checks (ENG-56)", () => {
  it("audit hash chain is deterministic and tamper-evident", () => {
    const a = new AuditChain();
    a.record("pre", { x: 1 });
    a.record("post", { y: 2 });
    const c1 = a.finalize();
    const b = new AuditChain();
    b.record("pre", { x: 1 });
    b.record("post", { y: 2 });
    const c2 = b.finalize();
    expect(c1).toEqual(c2);
    expect(c1[0]!.chainHash).not.toBe(c1[1]!.chainHash);
  });

  it("verification-report.example.json has required fields", () => {
    const raw = readFileSync(
      join(repoRoot, "verification-report.example.json"),
      "utf8",
    );
    const data: unknown = JSON.parse(raw);
    expect(data).toMatchObject({
      schemaVersion: 1,
      redactEndpoint: expect.any(String),
      targets: expect.any(Object),
      results: expect.any(Object),
      metrics: expect.any(Object),
    });
  });

  it("RedactApiAnalyzeResponse validator accepts minimal valid payload", () => {
    const sample = {
      results: [
        {
          entity_type: "EMAIL_ADDRESS",
          start: 0,
          end: 5,
          score: 0.9,
        },
      ],
      metadata: { processing_time_ms: 1 },
    };
    expect(isRedactAnalyzeResponse(sample)).toBe(true);
  });
});

import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const storeDir = join(process.cwd(), ".verification");
const storeFile = join(storeDir, "metrics.jsonl");

export function resetMetricsStore(): void {
  try {
    rmSync(storeFile, { force: true });
  } catch {
    /* ignore */
  }
  try {
    mkdirSync(storeDir, { recursive: true });
  } catch {
    /* ignore */
  }
  writeFileSync(storeFile, "", "utf8");
}

export function appendMetric(line: Record<string, unknown>): void {
  appendFileSync(storeFile, `${JSON.stringify(line)}\n`, "utf8");
}

export function readAllMetrics(): Record<string, unknown>[] {
  try {
    const raw = readFileSync(storeFile, "utf8").trim();
    if (!raw) return [];
    return raw.split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
  } catch {
    return [];
  }
}

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { VerificationMetrics } from "./metrics.js";

export interface VerificationReport {
  schemaVersion: 1;
  generatedAt: string;
  redactEndpoint: string;
  targets: {
    piiDetectionRateMin: number;
    falsePositiveRateMax: number;
    redactionLatencyMsMax: number;
    auditLogCompletenessPercent: number;
    edgeCasesRequired: number;
  };
  results: {
    piiDetectionRate: number | null;
    falsePositiveRate: number | null;
    medianLatencyMs: number | null;
    medianProcessingTimeMs: number | null;
    meetsLatencyTarget: boolean | null;
    meetsDetectionTarget: boolean | null;
    meetsFalsePositiveTarget: boolean | null;
  };
  metrics: VerificationMetrics;
  notes: string[];
}

export function buildReport(
  metrics: VerificationMetrics,
  redactEndpoint: string,
  notes: string[] = [],
): VerificationReport {
  const piiDetectionRate =
    metrics.detectionTotalCases > 0
      ? metrics.detectionPositiveCases / metrics.detectionTotalCases
      : null;
  const falsePositiveRate =
    metrics.falsePositiveTotalCases > 0
      ? metrics.falsePositiveCases / metrics.falsePositiveTotalCases
      : null;

  const medianLatencyMs = median(metrics.latencyMsSamples);
  const medianProcessingTimeMs = median(metrics.processingTimeMsSamples);

  const targets = {
    piiDetectionRateMin: 0.99,
    falsePositiveRateMax: 0.01,
    redactionLatencyMsMax: 10,
    auditLogCompletenessPercent: 100,
    edgeCasesRequired: 5,
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    redactEndpoint,
    targets,
    results: {
      piiDetectionRate,
      falsePositiveRate,
      medianLatencyMs,
      medianProcessingTimeMs,
      meetsLatencyTarget:
        medianLatencyMs === null ? null : medianLatencyMs < targets.redactionLatencyMsMax,
      meetsDetectionTarget:
        piiDetectionRate === null ? null : piiDetectionRate >= targets.piiDetectionRateMin,
      meetsFalsePositiveTarget:
        falsePositiveRate === null ? null : falsePositiveRate <= targets.falsePositiveRateMax,
    },
    metrics,
    notes: [
      ...notes,
      "Thresholds are targets from ENG-56; measured rates depend on censgate/redact recognizers and fixture design.",
    ],
  };
}

function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function writeReportJson(report: VerificationReport, path?: string): void {
  const defaultPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "verification-report.json",
  );
  writeFileSync(path ?? defaultPath, JSON.stringify(report, null, 2), "utf8");
}

/**
 * Aggregated metrics for verification-report.json (best-effort; thresholds are targets per ENG-56).
 * Persists to .verification/metrics.jsonl so the reporter can aggregate after Vitest workers exit.
 */

import { appendMetric, readAllMetrics } from "./metricsStore.js";

export interface VerificationMetrics {
  latencyMsSamples: number[];
  processingTimeMsSamples: number[];
  detectionPositiveCases: number;
  detectionTotalCases: number;
  falsePositiveCases: number;
  falsePositiveTotalCases: number;
}

const metrics: VerificationMetrics = {
  latencyMsSamples: [],
  processingTimeMsSamples: [],
  detectionPositiveCases: 0,
  detectionTotalCases: 0,
  falsePositiveCases: 0,
  falsePositiveTotalCases: 0,
};

export function recordLatencyMs(ms: number): void {
  metrics.latencyMsSamples.push(ms);
  appendMetric({ kind: "latencyMs", ms });
}

export function recordProcessingTimeMs(ms: number | undefined): void {
  if (typeof ms === "number" && Number.isFinite(ms)) {
    metrics.processingTimeMsSamples.push(ms);
    appendMetric({ kind: "processingTimeMs", ms });
  }
}

export function recordDetectionHit(): void {
  metrics.detectionTotalCases += 1;
  metrics.detectionPositiveCases += 1;
  appendMetric({ kind: "detectionHit" });
}

export function recordDetectionMiss(): void {
  metrics.detectionTotalCases += 1;
  appendMetric({ kind: "detectionMiss" });
}

export function recordFalsePositive(): void {
  metrics.falsePositiveTotalCases += 1;
  metrics.falsePositiveCases += 1;
  appendMetric({ kind: "falsePositive" });
}

export function recordTrueNegative(): void {
  metrics.falsePositiveTotalCases += 1;
  appendMetric({ kind: "trueNegative" });
}

export function getMetrics(): VerificationMetrics {
  return metrics;
}

export function resetMetrics(): void {
  metrics.latencyMsSamples.length = 0;
  metrics.processingTimeMsSamples.length = 0;
  metrics.detectionPositiveCases = 0;
  metrics.detectionTotalCases = 0;
  metrics.falsePositiveCases = 0;
  metrics.falsePositiveTotalCases = 0;
}

/** Rebuild metrics from persisted JSONL (use in reporter after workers exit). */
export function aggregateMetricsFromStore(): VerificationMetrics {
  const rows = readAllMetrics();
  const out: VerificationMetrics = {
    latencyMsSamples: [],
    processingTimeMsSamples: [],
    detectionPositiveCases: 0,
    detectionTotalCases: 0,
    falsePositiveCases: 0,
    falsePositiveTotalCases: 0,
  };
  for (const r of rows) {
    if (r.kind === "latencyMs" && typeof r.ms === "number") {
      out.latencyMsSamples.push(r.ms);
    }
    if (r.kind === "processingTimeMs" && typeof r.ms === "number") {
      out.processingTimeMsSamples.push(r.ms);
    }
    if (r.kind === "detectionHit") {
      out.detectionTotalCases += 1;
      out.detectionPositiveCases += 1;
    }
    if (r.kind === "detectionMiss") {
      out.detectionTotalCases += 1;
    }
    if (r.kind === "falsePositive") {
      out.falsePositiveTotalCases += 1;
      out.falsePositiveCases += 1;
    }
    if (r.kind === "trueNegative") {
      out.falsePositiveTotalCases += 1;
    }
  }
  return out;
}

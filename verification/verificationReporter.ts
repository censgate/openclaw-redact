import type { Reporter } from "vitest/reporters";
import { getVerifyEndpoint } from "./endpoint.js";
import { aggregateMetricsFromStore } from "./metrics.js";
import { buildReport, writeReportJson } from "./report.js";

/**
 * Writes verification-report.json after the suite using persisted metrics JSONL.
 */
export default class VerificationReporter implements Reporter {
  onFinished(_files?: File[], _errors?: unknown[]): void {
    const aggregated = aggregateMetricsFromStore();
    const report = buildReport(aggregated, getVerifyEndpoint());
    writeReportJson(report);
    console.error(
      `Wrote verification-report.json (endpoint ${getVerifyEndpoint()})`,
    );
  }
}

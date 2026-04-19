import { resetMetrics } from "./metrics.js";
import { resetMetricsStore } from "./metricsStore.js";

export default async function globalSetup(): Promise<void> {
  resetMetrics();
  resetMetricsStore();
}

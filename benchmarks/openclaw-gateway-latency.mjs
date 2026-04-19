#!/usr/bin/env node
/**
 * Optional gateway+mock latency probe when tier-2 compose is up.
 * Enable with OPENCLAW_BENCHMARK=1. Measures host → gateway → mock round-trip via `docker compose run`.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

if (process.env.OPENCLAW_BENCHMARK !== "1") {
  console.error("Set OPENCLAW_BENCHMARK=1 to run this benchmark.");
  process.exit(0);
}

const iterations = Number(process.env.BENCH_ITERATIONS ?? "20");
const warmup = Number(process.env.BENCH_WARMUP ?? "3");
const composeFile = "docker-compose.openclaw-e2e.yml";

async function oneTurn() {
  const start = process.hrtime.bigint();
  await execFileAsync(
    "docker",
    [
      "compose",
      "-f",
      composeFile,
      "--profile",
      "cli",
      "run",
      "--rm",
      "-T",
      "-e",
      "OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789",
      "-e",
      "OPENCLAW_GATEWAY_TOKEN=e2e-test-token",
      "openclaw-e2e",
      "agent",
      "--session-id",
      "openclaw-redact-e2e-bench",
      "--message",
      "ping",
      "--json",
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

async function main() {
  console.log(`OpenClaw gateway benchmark (${iterations} iters, warmup ${warmup})`);
  for (let i = 0; i < warmup; i++) {
    await oneTurn();
  }
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    samples.push(await oneTurn());
  }
  samples.sort((a, b) => a - b);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  console.log(`avg: ${avg.toFixed(1)} ms`);
  console.log(`p50: ${percentile(samples, 0.5).toFixed(1)} ms`);
  console.log(`p95: ${percentile(samples, 0.95).toFixed(1)} ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

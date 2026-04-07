const endpoint = process.env.REDACT_API_ENDPOINT ?? "http://127.0.0.1:8080";
const iterations = Number(process.env.BENCH_ITERATIONS ?? "100");
const warmup = Number(process.env.BENCH_WARMUP ?? "10");
const payload =
  process.env.BENCH_TEXT ??
  "Contact jane.doe@example.com or call (555) 123-4567. SSN 123-45-6789.";

async function run(): Promise<void> {
  console.log(`Benchmark target: ${endpoint}/api/v1/analyze`);
  console.log(`Warmup: ${warmup}, Iterations: ${iterations}`);

  for (let i = 0; i < warmup; i++) {
    await analyze(payload);
  }

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await analyze(payload);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    samples.push(elapsedMs);
  }

  samples.sort((a, b) => a - b);
  const p50 = percentile(samples, 0.5);
  const p95 = percentile(samples, 0.95);
  const p99 = percentile(samples, 0.99);
  const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;

  console.log("Latency results (ms):");
  console.log(`  avg: ${avg.toFixed(3)}`);
  console.log(`  p50: ${p50.toFixed(3)}`);
  console.log(`  p95: ${p95.toFixed(3)}`);
  console.log(`  p99: ${p99.toFixed(3)}`);
  console.log(`  min: ${samples[0].toFixed(3)}`);
  console.log(`  max: ${samples[samples.length - 1].toFixed(3)}`);
}

async function analyze(text: string): Promise<void> {
  const response = await fetch(`${endpoint}/api/v1/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, language: "en" }),
  });

  if (!response.ok) {
    throw new Error(`Benchmark request failed with status ${response.status}`);
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.max(0, Math.ceil(values.length * p) - 1);
  return values[index];
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Poll OpenClaw gateway HTTP until /healthz responds OK (host → published port).
 */
const base = (process.env.OPENCLAW_GATEWAY_URL ?? "http://127.0.0.1:18789").replace(
  /\/$/,
  "",
);
const url = `${base}/healthz`;
const maxAttempts = 120;

async function probe() {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

for (let i = 0; i < maxAttempts; i++) {
  try {
    await probe();
    console.error(`OpenClaw gateway ready at ${base}`);
    process.exit(0);
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.error(`Timed out waiting for OpenClaw gateway at ${base}`);
process.exit(1);

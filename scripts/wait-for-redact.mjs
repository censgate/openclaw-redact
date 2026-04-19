#!/usr/bin/env node
/**
 * Poll Redact HTTP API from the host until it accepts analyze requests.
 */
const endpoint = (
  process.env.REDACT_VERIFY_ENDPOINT ?? "http://127.0.0.1:8080"
).replace(/\/$/, "");
const url = `${endpoint}/api/v1/analyze`;
const maxAttempts = 90;

async function probe() {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "ok", language: "en" }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  if (typeof json !== "object" || json === null || !("results" in json)) {
    throw new Error("unexpected analyze response shape");
  }
}

for (let i = 0; i < maxAttempts; i++) {
  try {
    await probe();
    console.error(`Redact API ready at ${endpoint}`);
    process.exit(0);
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.error(`Timed out waiting for Redact at ${endpoint}`);
process.exit(1);

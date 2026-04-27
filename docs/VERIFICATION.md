# Local verification suite (ENG-56)

This repository includes **two** verification tiers for `@censgate/openclaw-redact`. Both use a running **censgate/redact** HTTP API and **no** OpenRouter or other external LLM services.

These assets are for development and release verification only. The npm runtime package is limited by `package.json#files` and does not ship this document, compose files, verification tests, sample fixtures, or benchmark scripts.

## Tier 1 vs tier 2

| Tier | Command | What it proves |
|------|---------|----------------|
| **Tier 1** (fast) | `make verify` | Direct `OpenClawRedactPlugin` hooks (`preLLMHook`, `postLLMHook`, `toolCallHook`) against Redact; matrix + edge + API contract tests; writes `verification-report.json`. |
| **Tier 2** (gateway fidelity) | `make verify-openclaw-e2e` | Real **OpenClaw gateway** (`ghcr.io/openclaw/openclaw`, pin with `OPENCLAW_TAG`), plugin installed from `npm pack`, **mock OpenAI-compatible LLM**, and `openclaw agent --message` through the gateway. Asserts chosen literals from the user turn do not appear in the mock’s last `POST /v1/chat/completions` body. |

Tier 2 is slower (Docker build/bring-up, one agent turn) and optional for day-to-day iteration; tier 1 remains the default CI gate.

### Tier 2 prerequisites

- Docker (BuildKit-capable)
- Same Node as tier 1 (20+)
- Ports on the host: **8080** (Redact), **18789** (gateway), **13000** (mock LLM debug endpoint for tests)

### Tier 2 environment

- **`OPENCLAW_TAG`** (default in `Makefile`: `2026.4.24`): OpenClaw image tag for `ghcr.io/openclaw/openclaw:<tag>`.
- **`OPENCLAW_GATEWAY_TOKEN`** (default in compose: `e2e-test-token`): must match gateway and CLI profile in `docker-compose.openclaw-e2e.yml`.
- **`REDACT_VERIFY_ENDPOINT`**: tier-1 style; tier 2 still waits for Redact at `http://127.0.0.1:8080` from the host.

### Tier 2 optional benchmark

With the tier-2 compose stack **up**, you can sample end-to-end latency (host → gateway → mock):

```bash
OPENCLAW_BENCHMARK=1 node benchmarks/openclaw-gateway-latency.mjs
```

Or `npm run benchmark:openclaw-gateway` after exporting `OPENCLAW_BENCHMARK=1`. This is informational only and not a release gate.

## What is (and is not) covered

- **In scope**: Hook harness (`preLLMHook` → mock LLM → `postLLMHook`, `toolCallHook`) against a real Redact container; PII leakage heuristics on LLM-bound strings; API response shape checks; edge cases (nested JSON, unicode, adversarial prompts, large payloads, concurrency); verification-side audit hash chain; `verification-report.json` with ENG-56 target metrics.
- **Out of scope** (per ENG-56): performance benchmarking as a product gate, penetration testing, cloud deployment testing, production audit-log / hash-chain parity (tracked separately from this plugin repo).

Tier 1 **does not** embed a full OpenClaw gateway; it exercises the same plugin hooks a gateway would call. Tier 2 runs the **official** gateway image with the plugin installed inside the image (`openclaw plugins install` from the packed tarball).

## Prerequisites

- Docker (for `ghcr.io/censgate/redact:full`)
- Node.js 22.14+ (matches `openclaw` `engines`; LTS 22.x or 24.x recommended)

## Local generated files

Remove build output, npm pack tarballs, `verification-report.json`, and `.verification/` (metrics used for the report):

```bash
make clean
```

## Run (tier 1)

From the repo root:

```bash
make verify
```

This will:

1. Start Redact via `docker-compose.verify.yml`
2. Wait until `POST /api/v1/analyze` succeeds from the host
3. Run `npm run test:verification` (Vitest + `verification/**/*.test.ts`)
4. Write `verification-report.json` (gitignored) with measured medians and ENG-56 **target** comparisons
5. Tear down the compose stack

Override the API URL if needed:

```bash
make verify REDACT_VERIFY_ENDPOINT=http://127.0.0.1:9090
```

## Run (tier 2 — OpenClaw in Docker)

From the repo root (builds gateway image, brings up Redact + mock + gateway, runs `npm run test:openclaw-e2e`, then tears down):

```bash
make verify-openclaw-e2e
```

Pin the gateway image tag:

```bash
make verify-openclaw-e2e OPENCLAW_TAG=2026.4.24
```

Stop tier 2 without a full run:

```bash
make verify-openclaw-e2e-down
```

## Interpreting `verification-report.json`

| Field | Meaning |
|--------|---------|
| `results.medianLatencyMs` | End-to-end hook + HTTP latency samples (host → Redact), not plugin CPU alone |
| `results.medianProcessingTimeMs` | Redact API `processing_time_ms` when returned |
| `targets.redactionLatencyMsMax` | ENG-56 target (&lt;10 ms typical); measured median often includes network RTT to Docker |
| `results.meetsLatencyTarget` | **Informational**—may be false until baselines are calibrated in CI |
| `metrics` | Aggregated from `.verification/metrics.jsonl` during the run |

Treat ENG-56 thresholds as **targets**: tune fixtures and CI baselines before gating releases on these booleans alone.

## Human review samples

Structured before/after examples for manual inspection live in [`../verification/samples/samples.json`](../verification/samples/samples.json) (10+ entries). These are static references; the automated suite is the source of truth for pass/fail.

## Production audit logs

Structured production audit streams and cryptographic log chaining are **not** implemented in the plugin today. This suite records a **verification-only** hash chain in [`verification/harness/auditChain.ts`](../verification/harness/auditChain.ts). For platform-level audit expansion, see internal tracking (e.g. Linear ENG-56).

# OpenClaw Redact Plugin

OpenClaw plugin that delegates PII detection to the Rust-powered
[censgate/redact](https://github.com/censgate/redact) **HTTP API**.

This package does **not** implement local regex-based detection logic. It wraps
the upstream Redact engine and applies redaction/restoration behavior in OpenClaw hooks.

## Backend choice

- Backend: **HTTP only**
- Expected engine: `redact-api` from `censgate/redact`
- Recommended image (ONNX NER enabled): `ghcr.io/censgate/redact:full`

## Quick start

Run Redact API with ONNX capabilities enabled:

```bash
docker run --rm -p 8080:8080 ghcr.io/censgate/redact:full
```

Install plugin:

```bash
openclaw plugins install @censgate/openclaw-redact
```

Configure in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "censgate-redact": {
        "enabled": true,
        "config": {
          "mode": "reversible",
          "excludeAgents": ["internal-trusted"],
          "logRedactions": false,
          "http": {
            "endpoint": "http://127.0.0.1:8080",
            "timeoutMs": 1500,
            "language": "en"
          }
        }
      }
    }
  }
}
```

## How it works

1. `preLLMHook` calls `POST /api/v1/analyze` on the Redact API.
2. Detected spans are replaced with `[REDACTED:<ENTITY_TYPE>:<id>]` placeholders
   in reversible mode (or non-reversible placeholders in irreversible mode).
3. `postLLMHook` restores reversible placeholders using per-turn token storage.

## Environment variables

- `REDACT_API_ENDPOINT` (default: `http://127.0.0.1:8080`)

## Development

```bash
npm install
npm run build
npm test
```

## Latency benchmark (Docker option)

With Redact running in Docker:

```bash
docker run --rm -p 8080:8080 ghcr.io/censgate/redact:full
```

Run benchmark:

```bash
npm run benchmark
```

Optional environment variables:

- `REDACT_API_ENDPOINT` (benchmark target)
- `BENCH_ITERATIONS` (default: `100`)
- `BENCH_WARMUP` (default: `10`)
- `BENCH_TEXT` (custom test payload)

## License

Apache-2.0

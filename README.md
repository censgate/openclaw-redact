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
            "language": "en",
            "docker": {
              "enabled": true,
              "image": "ghcr.io/censgate/redact:full",
              "containerName": "openclaw-redact-api",
              "host": "127.0.0.1",
              "containerPort": 8080,
              "restartOnFailure": true
            }
          }
        }
      }
    }
  }
}
```

When `http.docker.enabled` is `true`, the plugin will:
- attempt Redact API call normally first
- if unreachable, auto-start/reuse the Docker container
- detect the mapped host port (including dynamic/random port assignment)
- update the runtime endpoint and retry automatically
- if the backend later becomes unreachable while OpenClaw is running, it retries
  bootstrap and (optionally) restarts the running container

## How it works

1. `preLLMHook` calls `POST /api/v1/analyze` on the Redact API.
2. Detected spans are replaced with `[REDACTED:<ENTITY_TYPE>:<id>]` placeholders
   in reversible mode (or non-reversible placeholders in irreversible mode).
3. `postLLMHook` restores reversible placeholders using per-turn token storage.

## Environment variables

- `REDACT_API_ENDPOINT` (default: `http://127.0.0.1:8080`)
- `REDACT_DOCKER_AUTOSTART` (`true|false`, default `false`)
- `REDACT_DOCKER_IMAGE` (default `ghcr.io/censgate/redact:full`)
- `REDACT_DOCKER_CONTAINER_NAME` (default `openclaw-redact-api`)
- `REDACT_DOCKER_HOST` (default `127.0.0.1`)
- `REDACT_DOCKER_HOST_PORT` (optional; if omitted, Docker chooses a free port)
- `REDACT_DOCKER_CONTAINER_PORT` (default `8080`)
- `REDACT_DOCKER_PULL` (`true|false`, default `false`)
- `REDACT_DOCKER_RESTART_ON_FAILURE` (`true|false`, default `true`)
- `REDACT_DOCKER_STARTUP_TIMEOUT_MS` (default `30000`)
- `REDACT_DOCKER_STARTUP_PROBE_INTERVAL_MS` (default `500`)

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

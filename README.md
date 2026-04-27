<div align="center">

<img src="https://raw.githubusercontent.com/censgate/redact/main/assets/censgate-redact-logo-v1.png" alt="Censgate Redact" width="400">

[![Node.js](https://img.shields.io/badge/node-%3E%3D22.14-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/censgate/openclaw-redact/actions/workflows/ci.yml/badge.svg)](https://github.com/censgate/openclaw-redact/actions)
[![npm](https://img.shields.io/npm/v/@censgate/openclaw-redact.svg)](https://www.npmjs.com/package/@censgate/openclaw-redact)

**PII redaction for OpenClaw, powered by [Censgate Redact](https://github.com/censgate/redact)**

OpenClaw plugin that calls the Rust **Redact HTTP API** on the LLM path and restores reversible placeholders after the model runs.

[Quick start](#quick-start) · [Documentation](#documentation) · [How it works](#how-it-works) · [Configuration](#configuration) · [Contributing](CONTRIBUTING.md)

</div>

---

## Features

- **Engine-backed** — Detection and policy live in [censgate/redact](https://github.com/censgate/redact) (`redact-api`), not duplicated in TypeScript
- **HTTP only** — No bundled regex/ML; you point the plugin at a Redact API (local or remote)
- **Sensible defaults** — Reversible redaction against a configured or local Redact API endpoint
- **Opt-in Docker helper** — For trusted local development, the plugin can start or reuse `ghcr.io/censgate/redact:full`, discover the mapped port, and retry
- **OpenClaw-native** — `preLLMHook` / `postLLMHook` integration with per-turn token storage for restore

This package does **not** implement local pattern matching. It wraps the upstream engine and applies redaction/restoration in OpenClaw hooks.

## Requirements

- **Node.js** [>= 22.14.0](https://nodejs.org/) (see `engines` in `package.json`)
- **OpenClaw** with plugin support, compatible with this package’s OpenClaw peer range
- A running Redact HTTP API. For local development, start the [Redact full image](https://github.com/censgate/redact) (`ghcr.io/censgate/redact:full`) with ONNX-capable NER, or point the plugin at a hosted `redact-api` using `REDACT_API_ENDPOINT` / `http.endpoint`.
- **Optional:** Docker, only if you explicitly enable the plugin's Docker auto-start helper for a trusted local environment.

## Quick start

**1. Install the plugin**

```bash
openclaw plugins install @censgate/openclaw-redact
```

**2. Start or configure Redact**

By default the plugin is enabled, uses **reversible** redaction, and calls `http://127.0.0.1:8080`. Start Redact yourself or set `REDACT_API_ENDPOINT` / `http.endpoint` to an existing trusted Redact API.

**3. Optional — if you use a plugin allowlist**, allow the plugin id and ensure it is enabled:

```json
{
  "plugins": {
    "allow": ["censgate-redact"],
    "entries": {
      "censgate-redact": { "enabled": true }
    }
  }
}
```

**Local Redact with Docker:** start the API yourself, then align the endpoint:

```bash
docker run --rm -p 8080:8080 ghcr.io/censgate/redact:full
# Plugin defaults expect http://127.0.0.1:8080 (or set REDACT_API_ENDPOINT).
```

**Optional auto-start:** in trusted local development only, enable Docker auto-start with `REDACT_DOCKER_AUTOSTART=true` or `http.docker.enabled: true`.

## Installation

- **From npm (recommended for users):** `openclaw plugins install @censgate/openclaw-redact` (or `npm install -g` / `npx` patterns your OpenClaw version documents).
- **From source (contributors):** clone this repo, run `npm install`, `npm run build`, then point OpenClaw at the built extension per OpenClaw’s local-plugin instructions.

Package id in OpenClaw: **`censgate-redact`** (see `openclaw.plugin.json`).

## Backend

- **Protocol:** HTTP only to Redact’s REST API
- **Engine:** `redact-api` from [censgate/redact](https://github.com/censgate/redact)
- **Recommended image (pattern + ONNX NER):** `ghcr.io/censgate/redact:full` — used by manual Docker runs and the opt-in Docker auto-start helper

## How it works

1. `preLLMHook` calls `POST /api/v1/analyze` on the Redact API.
2. Detected spans are replaced with `[REDACTED:<ENTITY_TYPE>:<id>]` placeholders in **reversible** mode (or non-reversible placeholders in **irreversible** mode).
3. `postLLMHook` restores reversible placeholders using per-turn token storage.

**Reversible mode and memory:** Restoration uses an in-memory map from placeholder to original substring for the current turn. The plugin does **not** encrypt those token entries or persist them to disk. Any process with access to the OpenClaw gateway memory could read them while they exist. For workflows where placeholders must not be reversible, use `mode: "irreversible"`.

## Configuration

### Default behavior (out of the box)

With no custom config, the plugin typically:

- Stays **enabled**; **reversible** mode; no agent exclude list; redaction logging off
- Calls the configured Redact HTTP API endpoint, defaulting to `http://127.0.0.1:8080`
- Leaves Docker auto-start **disabled** unless explicitly enabled via env or config
- Keeps the Docker helper defaults available when opted in: image `ghcr.io/censgate/redact:full`, dynamic host port when `hostPort` is unset, and restart-on-failure behavior
- Leaves **`entityTypes` unset** so Redact applies its full built-in recognizer set (broad PII / HIPAA / GDPR–oriented coverage)

### When Docker auto-start is explicitly enabled

- The plugin attempts a Redact API call first.
- If unreachable, it auto-starts or reuses the container, detects the mapped host port (including dynamic assignment), updates the runtime endpoint, and retries.
- If the backend becomes unreachable while OpenClaw is running, it can retry bootstrap and optionally restart the container.

### Advanced / production (optional)

For sustained load, use an existing Redact endpoint, pin a stable host port if using Docker, raise timeouts, and optionally pre-pull the image. Example:

```json
{
  "plugins": {
    "entries": {
      "censgate-redact": {
        "enabled": true,
        "config": {
          "mode": "reversible",
          "excludeAgents": [],
          "logRedactions": false,
          "http": {
            "endpoint": "http://127.0.0.1:18080",
            "timeoutMs": 3000,
            "language": "en",
            "docker": {
              "enabled": true,
              "image": "ghcr.io/censgate/redact:full",
              "containerName": "openclaw-redact-api",
              "host": "127.0.0.1",
              "hostPort": 18080,
              "containerPort": 8080,
              "pull": true,
              "restartOnFailure": true,
              "startupTimeoutMs": 45000,
              "startupProbeIntervalMs": 500
            }
          }
        }
      }
    }
  }
}
```

**Notes:** Keep `entityTypes` unset unless you need a narrower scope. Use `mode: "irreversible"` for strictly untrusted downstream workflows. For multiple OpenClaw instances on one host, use unique `containerName` and `hostPort` values.

## Environment variables

All variables below are **optional** configuration overrides. **None are required** for the plugin to run with defaults, and none are cloud or provider credentials. The plugin **does not** read `REDACT_ENCRYPTION_KEY`, `REDACT_PERFORMANCE_MODE`, or other undocumented `REDACT_*` names.

| Variable | Role |
|----------|------|
| `REDACT_API_ENDPOINT` | Redact base URL (default: `http://127.0.0.1:8080`) |
| `REDACT_ENTITY_TYPES` | Comma-separated entity filter (optional) |
| `REDACT_DOCKER_AUTOSTART` | `true\|false` (default: `false`) |
| `REDACT_DOCKER_IMAGE` | Default: `ghcr.io/censgate/redact:full` |
| `REDACT_DOCKER_CONTAINER_NAME` | Default: `openclaw-redact-api` |
| `REDACT_DOCKER_HOST` | Default: `127.0.0.1` |
| `REDACT_DOCKER_HOST_PORT` | Optional; omit for dynamic port |
| `REDACT_DOCKER_CONTAINER_PORT` | Default: `8080` |
| `REDACT_DOCKER_PULL` | `true\|false` (default: `false`) |
| `REDACT_DOCKER_RESTART_ON_FAILURE` | `true\|false` (default: `true`) |
| `REDACT_DOCKER_STARTUP_TIMEOUT_MS` | Default: `30000` |
| `REDACT_DOCKER_STARTUP_PROBE_INTERVAL_MS` | Default: `500` |

## Development

```bash
npm install
npm run build
npm test
```

Clean build artifacts and pack tarballs: `make clean` (or `npm run clean`).

## Testing & verification

This repository keeps package-local checks only:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

Docker-backed Redact verification, OpenClaw gateway E2E tests, mock LLM fixtures,
and latency benchmarks live in
[`censgate/openclaw-redact-benchmark`](https://github.com/censgate/openclaw-redact-benchmark).
See [docs/VERIFICATION.md](docs/VERIFICATION.md) for details.

## Latency benchmark

Latency probes are maintained in
[`censgate/openclaw-redact-benchmark`](https://github.com/censgate/openclaw-redact-benchmark)
so the published plugin source remains focused on runtime code.

## Documentation

- [Verification & E2E](docs/VERIFICATION.md) — ports, images, matrix tests
- [Contributing](CONTRIBUTING.md) — PRs, dev setup, security contact
- [Censgate Redact (engine)](https://github.com/censgate/redact) — API, Docker images, entity types, CLI
- [Issues](https://github.com/censgate/openclaw-redact/issues) — bugs and feature requests

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, `npm run lint` / `typecheck` / `test`, and the security reporting process.

## License

[Apache License 2.0](LICENSE).

## Support

- [GitHub Issues](https://github.com/censgate/openclaw-redact/issues) — bugs and feature requests
- **Engine / API questions:** [censgate/redact](https://github.com/censgate/redact) and its docs
- For security issues, follow [CONTRIBUTING.md](CONTRIBUTING.md) (do not use public issues for sensitive reports)

---

**[Star on GitHub](https://github.com/censgate/openclaw-redact)** if this plugin is useful to you.

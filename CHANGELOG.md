# Changelog

## 0.1.2

### Patch Changes

- Fix Create GitHub Release workflow by inlining the npm publish job so the release pipeline schedules reliably, and cut release 0.1.2.

## 0.1.1

### Patch Changes

- a8ade12: Automate versioning and npm releases with Changesets, a version-packages PR workflow, and automatic GitHub Releases that trigger the existing npm publish action.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04-22

Initial open-source release.

### Added

- OpenClaw plugin wrapping the [censgate/redact](https://github.com/censgate/redact)
  HTTP API for privacy-preserving LLM interactions.
- `preLLMHook` that calls `POST /api/v1/analyze` on the Redact API and
  replaces detected spans with `[REDACTED:<ENTITY_TYPE>:<id>]` placeholders.
- `postLLMHook` that restores reversible placeholders using per-turn token
  storage.
- Redaction modes: `reversible` (default) and `irreversible`.
- `excludeAgents` option to bypass redaction for trusted agents.
- Docker auto-start / self-healing for the Redact backend, including dynamic
  host-port detection and restart-on-failure.
- Configuration via `openclaw.json` and `REDACT_*` environment variables.
- Tier 1 hook-harness verification suite (`make verify`) against a Dockerized
  Redact API.
- Tier 2 end-to-end verification suite (`make verify-openclaw-e2e`) with an
  OpenClaw gateway, mock OpenAI-compatible LLM, and agent turn through the
  gateway.
- HTTP latency benchmark (`npm run benchmark`) and gateway benchmark
  (`npm run benchmark:openclaw-gateway`).

[Unreleased]: https://github.com/censgate/openclaw-redact/compare/v0.1.2...HEAD
[0.1.0]: https://github.com/censgate/openclaw-redact/releases/tag/v0.1.0

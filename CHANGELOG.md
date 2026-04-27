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

### Changed

- Expand `openclaw.plugin.json` / runtime `configSchema` (Zod + `scripts/sync-openclaw-plugin-json-schema.mjs`) so registry metadata lists the real config shape and documents optional `REDACT_*` env overrides.
- Clarify in README and SECURITY that reversible mode keeps originals in unencrypted per-turn memory and that undocumented env vars such as `REDACT_ENCRYPTION_KEY` / `REDACT_PERFORMANCE_MODE` are not used.
- Make Docker auto-start opt-in by default so the plugin no longer attempts host-mutating Docker operations unless explicitly configured.
- Clarify that verification and benchmark assets are development/release tooling and are not shipped in the npm runtime package.

### Removed

- Remove stale root `PRD.md` that described unimplemented encryption and performance env vars.
- Remove the npm `postinstall` hook and its script so package installation does not run project sync commands.
- Remove the source-linked example verification report that used localhost URL data.

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

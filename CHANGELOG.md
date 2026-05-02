# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Bump `@anthropic-ai/sdk` to `^0.91.1` via npm override to address CVE-2026-41686 (Insecure Default File Permissions in Local Filesystem Memory Tool). This is a devDependency with no runtime impact.

## 0.1.4 - 2026-04-26

### Changed

- Move Docker-backed verification, OpenClaw gateway E2E, mock LLM, and benchmark tooling to `censgate/openclaw-redact-benchmark` so this source repository stays focused on the shipped plugin package.
- Replace local extended verification docs with pointers to the benchmark repository.

## 0.1.3

### OpenClaw plugin registry and scanner alignment

- Expand `configSchema` in `openclaw.plugin.json` and keep it in sync with the runtime Zod model via `src/config-schema.ts` and `scripts/sync-openclaw-plugin-json-schema.mjs`, so the OpenClaw plugin registry and automated scans see the same configuration shape as the shipped plugin. Optional `REDACT_*` environment overrides are documented in the published schema description.

### Changed

- Clarify in README and SECURITY that reversible mode keeps originals in unencrypted per-turn memory and that undocumented env vars such as `REDACT_ENCRYPTION_KEY` / `REDACT_PERFORMANCE_MODE` are not read by this plugin.
- Make Docker auto-start opt-in by default so the plugin does not perform host-mutating Docker operations unless explicitly configured.
- Clarify that verification and benchmark assets are development or release tooling and are not included in the npm package.

### Removed

- Remove stale root `PRD.md` that described unimplemented encryption and performance environment variables.
- Remove the npm `postinstall` hook and its script so `npm install` of this package does not run repository sync commands.
- Remove the source-linked example verification report that embedded localhost URL data.

## 0.1.2

### Patch Changes

- Fix Create GitHub Release workflow by inlining the npm publish job so the release pipeline schedules reliably, and cut release 0.1.2.

## 0.1.1

### Patch Changes

- a8ade12: Automate versioning and npm releases with Changesets, a version-packages PR workflow, and automatic GitHub Releases that trigger the existing npm publish action.

## [0.1.0] - 2026-04-22

Initial open-source release.

Co-Authored-By: Paperclip <noreply@paperclip.ing>

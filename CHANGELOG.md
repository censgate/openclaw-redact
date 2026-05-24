# Changelog

## 0.1.7

### Patch Changes

- 2c444f7: Security: regenerate lockfile and resolve npm audit advisories (transitive devDependencies only).

## [Unreleased]

### Security

- Regenerate `package-lock.json` to apply existing npm overrides for transitive CVE fixes (fast-uri, fast-xml-builder, hono, ip-address, protobufjs, basic-ftp, @anthropic-ai/sdk). All are transitive devDependencies with no production code impact.
- Security: bump protobufjs to ^7.5.8 via npm override to address CVE-2026-44293, CVE-2026-44291, CVE-2026-44290, CVE-2026-44294, CVE-2026-44292, CVE-2026-44288 (code injection, DoS, prototype pollution). This is a transitive devDependency via @google/genai with no production code impact.
- Security: refresh `package-lock.json` to pull `basic-ftp` 5.3.1 (GHSA-rpmf-866q-6p89), `brace-expansion` 5.0.6 (GHSA-jxxr-4gwj-5jf2), and `ws` 8.20.1 (GHSA-58qx-3vcg-4xpx). These remain transitive **devDependency** paths (OpenClaw gateway / agent stacks used in tests and local development); the published package runtime graph is still `uuid` and `zod` only.

## 0.1.6

### Patch Changes

- 230185f: Security fixes for medium CVEs via dependabot updates

## 0.1.5

### Patch Changes

- 30b7969: Security: bump @anthropic-ai/sdk to ^0.91.1 (CVE-2026-41686)

  Fixes insecure default file permissions in local filesystem memory tool.
  This is a devDependency override; no runtime code changes.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Bump `@anthropic-ai/sdk` to `^0.91.1` via npm override to address CVE-2026-41686 (Insecure Default File Permissions in Local Filesystem Memory Tool). This is a devDependency with no runtime impact.
- Add npm overrides for `fast-uri` (^3.1.2) to address GHSA-v39h-62p7-jpjc / CVE-2026-6322 (host confusion via percent-encoded authority delimiters).
- Add npm overrides for `fast-xml-builder` (^1.1.7) to address GHSA-xq4p-q4h5-j25r / CVE-2026-44665 (attribute values with unwanted quotes bypassing validation).

Both are transitive devDependencies with no production code impact.

- Add npm overrides for `hono` (^4.12.18) to address CVE-2026-44458, CVE-2026-44457, CVE-2026-44455, CVE-2026-44459 (CSS injection, cache leakage, HTML injection, JWT validation).
- Add npm overrides for `ip-address` (^10.1.2) to address CVE-2026-42338 (XSS via Address6 HTML methods).

All are transitive devDependencies with no production code impact.

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

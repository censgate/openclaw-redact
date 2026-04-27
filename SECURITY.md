# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **Email:** security@censgate.com
2. **Do not** open a public GitHub issue for security vulnerabilities
3. Include steps to reproduce, impact assessment, and any suggested fixes

We aim to respond within 48 hours and will work with you to understand and resolve the issue.

## Supported Versions

Security fixes are provided for the most recent minor release on the `main`
branch. Older versions are not patched; please upgrade to receive fixes.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1   | No        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report suspected vulnerabilities privately to **security@censgate.com**.

Include, where possible:

- A description of the vulnerability and its impact.
- Steps to reproduce (proof-of-concept, request payloads, or test cases).
- The affected version(s) and environment (Node.js version, OS, Redact backend
  version / image tag).
- Any suggested mitigations or patches.

You can also use GitHub's private [security advisory
reporting](https://github.com/censgate/openclaw-redact/security/advisories/new)
for this repository.

### What to expect

- **Acknowledgement** within 3 business days.
- **Initial assessment** (severity, reproducibility, affected versions) within
  10 business days.
- **Fix timeline** communicated once the issue is triaged. Critical issues are
  prioritized for an out-of-band patch release; lower-severity issues are
  rolled into the next scheduled release.
- **Coordinated disclosure**: we will work with you on a disclosure timeline
  and credit you in the release notes unless you prefer to remain anonymous.

## Scope

In scope:

- The `@censgate/openclaw-redact` npm package and its source in this
  repository.
- Plugin configuration handling and environment-variable parsing.
- Docker auto-start / self-healing logic.
- Placeholder generation and per-turn token storage (redaction/restoration
  correctness and leakage).

Out of scope (please report upstream):

- Detection-engine vulnerabilities in the Redact API itself — report at
  https://github.com/censgate/redact.
- Vulnerabilities in OpenClaw core — report at the OpenClaw project.
- Issues in third-party dependencies — report to the dependency maintainer; we
  will track and upgrade once a fix is available.

## Security Considerations for Operators

- The plugin sends request payloads to the configured Redact endpoint. Run
  Redact on a trusted network path (loopback or a private network); do not
  point the plugin at an untrusted endpoint.
- Docker auto-start is disabled by default. If you enable it with
  `REDACT_DOCKER_AUTOSTART=true` or `http.docker.enabled: true`, the plugin may
  run Docker commands to start, reuse, inspect, or restart a Redact container.
  Use it only in trusted local environments.
- `logRedactions: true` may write detected PII to logs. Leave it disabled in
  production unless you have a compliant log sink.
- Reversible mode stores the mapping from placeholders back to original
  values in per-turn **process memory** only. The plugin does **not** encrypt
  those token entries and does **not** read a `REDACT_ENCRYPTION_KEY` (or
  similar) for them. Treat the gateway process like any other component that
  may briefly hold sensitive substrings in RAM. Use `mode: "irreversible"`
  when restoration must not be possible. Ensure your OpenClaw runtime does not
  persist this memory to untrusted storage.

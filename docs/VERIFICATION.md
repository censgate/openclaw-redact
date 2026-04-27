# Extended Verification

Extended verification and benchmark tooling for `@censgate/openclaw-redact`
now lives in the public
[`censgate/openclaw-redact-benchmark`](https://github.com/censgate/openclaw-redact-benchmark)
repository.

This plugin repository keeps only package-local source, unit tests, build
metadata, and release automation. The benchmark repository owns the Docker-backed
Redact verification suite, OpenClaw gateway E2E harness, mock LLM, sample
fixtures, and latency probes.

Use the benchmark repo when you need to verify a published package against a
real Redact API or OpenClaw gateway:

```bash
git clone https://github.com/censgate/openclaw-redact-benchmark.git
cd openclaw-redact-benchmark
npm ci
make verify
make verify-openclaw-e2e OPENCLAW_REDACT_PACKAGE=@censgate/openclaw-redact@latest
```

For normal plugin development in this repo, run:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

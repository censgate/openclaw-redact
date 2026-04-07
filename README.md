# OpenClaw Redact Plugin

<p align="center">
  <img src="https://github.com/censgate/redact/raw/main/assets/censgate-redact-logo-v1.png" alt="Censgate Redact" width="200">
</p>

<p align="center">
  <strong>Privacy without the pause. Real-time PII protection for any LLM provider.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://openclaw.ai"><img src="https://img.shields.io/badge/OpenClaw-Plugin-green.svg" alt="OpenClaw Plugin"></a>
  <a href="https://github.com/censgate/redact"><img src="https://img.shields.io/badge/Powered%20by-Censgate%20Redact-orange.svg" alt="Censgate Redact"></a>
</p>

---

## Overview

An OpenClaw plugin that provides privacy-preserving LLM interactions by redacting sensitive information from prompts before sending to LLM providers, with support for **reversible redaction** to restore data for trusted internal agents.

### Why OpenClaw Redact?

- 🔒 **Privacy-First**: Keep PII out of LLM provider logs
- ⚡ **Real-Time**: Sub-millisecond latency for voice/chat applications
- 🔄 **Reversible**: Redact for external LLMs, restore for trusted agents
- 🌐 **Universal**: Works with OpenAI, Anthropic, local models, any provider
- 🏥 **Compliance**: HIPAA, GDPR, SOX patterns built-in

## Quick Start

```bash
openclaw plugins install @censgate/openclaw-redact
```

Add to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "censgate-redact": {
        "enabled": true,
        "config": {
          "mode": "reversible",
          "entities": ["pii", "credentials", "financial"]
        }
      }
    }
  }
}
```

That's it! The plugin automatically redacts sensitive data before sending to LLM providers.

## Features

### 🎯 Core Capabilities
- **Entity Detection**: 36+ entity types (PII, credentials, financial, healthcare)
- **Reversible Redaction**: Tag-based tokens that can be restored
- **Provider Agnostic**: Works with any LLM API or local model
- **Configurable Patterns**: JSON-based entity pattern configuration
- **Performance**: <1ms processing per message

### 📋 Entity Categories
- **Personal Identifiers**: Names, emails, phones, SSNs
- **Financial Data**: Credit cards, bank accounts, crypto wallets
- **Credentials**: API keys, passwords, tokens
- **Healthcare**: Medical record numbers, diagnoses
- **Location**: Addresses, coordinates
- **Custom Patterns**: Regex-based user-defined entities

### 🔄 Redaction Modes
1. **Irreversible** - Permanent removal (for untrusted external services)
2. **Reversible** - Tagged replacement with restoration capability
3. **Audit-Only** - Detection without modification (logging/monitoring)

## Architecture

```
User Input → Pre-LLM Redaction → External LLM → Post-LLM Response → User
                ↓
         [REDACTED:entity_type] tokens
                ↓
         Internal Agent (optional restoration)
```

### Hook Points
1. **Pre-LLM Hook** - Intercepts outbound messages before LLM API call
2. **Post-LLM Hook** - Processes responses for redaction restoration
3. **Tool Call Hook** - Sanitizes tool parameters containing sensitive data

## Configuration

### Plugin Config

```json
{
  "plugins": {
    "entries": {
      "censgate-redact": {
        "enabled": true,
        "config": {
          "mode": "reversible",
          "entities": ["pii", "credentials", "financial"],
          "customPatterns": [],
          "excludeAgents": ["internal-trusted"],
          "logRedactions": true
        }
      }
    }
  }
}
```

### Environment Variables
- `REDACT_API_ENDPOINT` - Redaction service URL (optional)
- `REDACT_ENCRYPTION_KEY` - Key for reversible token encryption
- `REDACT_PERFORMANCE_MODE` - `fast` (local) or `accurate` (enhanced with ONNX)

## Backend: Censgate Redact

This plugin is powered by [Censgate Redact](https://github.com/censgate/redact) — a Rust-based entity detection and redaction library.

### Components
- **Rust Library**: Core redaction engine (Apache 2.0)
- **Docker Image**: Pre-built with ONNX runtime for 36+ entity patterns
- **ONNX Runtime**: Required for full entity detection accuracy

### Deployment Options

#### Option 1: Built-in (Fast Mode)
Uses built-in regex patterns. No external dependencies.

#### Option 2: Docker (Accurate Mode)
```bash
docker run -p 8080:8080 ghcr.io/censgate/redact:latest
```
Full 36+ entity detection with ONNX NER models.

## API

### Automatic Usage
```javascript
// Plugin handles automatically via OpenClaw hooks
// No code changes needed for basic redaction
```

### Manual Redaction
```javascript
const { redact } = usePlugin('censgate-redact');
const sanitized = await redact(userInput, { mode: 'reversible' });
const response = await llmApi.call(sanitized);
```

### Restoration
```javascript
const { restore } = usePlugin('censgate-redact');
const restored = await restore(llmResponse, tokenMap);
```

### Token Format
```
[REDACTED:pii_email:uuid] → reversible
[REDACTED:credential_api_key] → irreversible
```

## Development

### Prerequisites
- OpenClaw >= 2026.3.28
- Node.js >= 20
- Censgate Redact library (see backend section)

### Build
```bash
npm install
npm run build
npm test
```

### Testing
- `npm test` - Unit tests
- `npm run test:integration` - Integration tests
- `npm run benchmark` - Performance benchmarks

## Performance

| Metric | Target |
|--------|--------|
| Redaction latency | <1ms per 1KB |
| Throughput | >10,000 msg/sec |
| Memory overhead | <50MB |

Real-time optimized for voice assistants and chat applications.

## Security

- ✅ No persistent storage of raw user data
- ✅ Reversible tokens use authenticated encryption
- ✅ Keys never exposed in logs or errors
- ✅ Memory zeroing after processing

## License

Apache 2.0 - See [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Related

- [Censgate Redact](https://github.com/censgate/redact) - Core redaction engine
- [OpenClaw](https://openclaw.ai) - Multi-channel AI gateway

---

<p align="center">
  <em>Built with 🔒 by <a href="https://censgate.com">Censgate</a></em>
</p>

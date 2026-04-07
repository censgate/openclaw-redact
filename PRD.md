# OpenClaw Redact Plugin - PRD

## Overview

An OpenClaw plugin that provides privacy-preserving LLM interactions by redacting sensitive information from prompts before sending to LLM providers, with support for reversible redaction to restore data for trusted internal agents.

## Goals

- Enable private LLM usage without exposing PII/sensitive data to external providers
- Support reversible redaction for trusted internal agent processing
- Work with any commodity LLM provider (OpenAI, Anthropic, local, etc.)
- Maintain sub-millisecond performance overhead
- Provide configurable entity detection patterns

## Architecture

### Plugin Type
OpenClaw Extension Plugin (hooks into the agent message pipeline)

### Hook Points
1. **Pre-LLM Hook** - Intercepts outbound messages before LLM API call
2. **Post-LLM Hook** - Processes responses for redaction restoration
3. **Tool Call Hook** - Sanitizes tool parameters containing sensitive data

### Data Flow

```
User Input → Pre-LLM Redaction → External LLM → Post-LLM Response → User
                ↓
         [REDACTED:entity_type] tokens
                ↓
         Internal Agent (optional restoration)
```

## Features

### Core Capabilities
- **Entity Detection**: 30+ entity types (PII, credentials, financial, healthcare)
- **Reversible Redaction**: Tag-based tokens that can be restored
- **Provider Agnostic**: Works with any LLM API or local model
- **Configurable Patterns**: JSON-based entity pattern configuration
- **Performance**: <1ms processing per message

### Entity Categories
- Personal Identifiers (names, emails, phones, SSNs)
- Financial Data (credit cards, bank accounts, crypto wallets)
- Credentials (API keys, passwords, tokens)
- Healthcare (medical record numbers, diagnoses)
- Location (addresses, coordinates)
- Custom Patterns (regex-based user-defined entities)

### Redaction Modes
1. **Irreversible** - Permanent removal (for untrusted external services)
2. **Reversible** - Tagged replacement with restoration capability
3. **Audit-Only** - Detection without modification (logging/monitoring)

## Configuration

### Plugin Config (`openclaw.json`)
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
- `REDACT_API_ENDPOINT` - Redaction service URL (optional, defaults to built-in)
- `REDACT_ENCRYPTION_KEY` - Key for reversible token encryption
- `REDACT_PERFORMANCE_MODE` - `fast` (local) or `accurate` (enhanced)

## API Surface

### Internal Methods
- `redact(text, options)` - Main redaction entry point
- `restore(text, tokens)` - Reverses redaction given token map
- `detect(text)` - Returns entities without redacting
- `configure(patterns)` - Runtime pattern updates

### Token Format
```
[REDACTED:pii_email:uuid] → reversible
[REDACTED:credential_api_key] → irreversible
```

## Integration Examples

### Basic Usage
```javascript
// Plugin handles automatically via OpenClaw hooks
// No code changes needed for basic redaction
```

### Manual Redaction (for custom tools)
```javascript
const { redact } = usePlugin('censgate-redact');
const sanitized = await redact(userInput, { mode: 'reversible' });
const response = await llmApi.call(sanitized);
```

### Restoration for Internal Agents
```javascript
const { restore } = usePlugin('censgate-redact');
const restored = await restore(llmResponse, tokenMap);
```

## Development

### Prerequisites
- OpenClaw >= 2026.3.28
- Node.js >= 20
- Rust toolchain (for native performance module)

### Build
```bash
npm install
npm run build
npm test
```

### Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Performance benchmarks: `npm run benchmark`

## Performance Targets
- Redaction latency: <1ms per 1KB text
- Throughput: >10,000 messages/second
- Memory overhead: <50MB baseline

## Security Considerations

### Data Handling
- No persistent storage of raw user data
- Reversible tokens use authenticated encryption
- Keys never exposed in logs or error messages
- Memory zeroing after processing

### Threat Model
- Protects against LLM provider data retention
- Mitigates prompt injection via credential exposure
- Prevents accidental PII in logs/transcripts

## License

Apache 2.0 - See LICENSE file

## Contributing

See CONTRIBUTING.md for guidelines

## Logo

Uses the Censgate Redact fingerprint-inspired logo:
`https://github.com/censgate/redact/blob/main/assets/censgate-redact-logo-v1.png`

---

*This is an open source plugin for privacy-preserving AI interactions.*

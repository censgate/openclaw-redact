# Contributing to OpenClaw Redact Plugin

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/openclaw-redact`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Refresh openclaw.plugin.json configSchema after changing src/config-schema.ts
npm run sync-plugin-json-schema

# Run tests
npm test

# Run linting
npm run lint
```

## Code Standards

- Follow TypeScript best practices
- Write tests for new features
- Ensure all tests pass before submitting PR
- Update documentation for API changes

## Releases and versioning

User-facing changes should include a [Changesets](https://github.com/changesets/changesets) entry so `CHANGELOG.md` and the npm version stay in sync:

```bash
npx changeset
```

Commit the new file under `.changeset/` with your PR. After merge to `main`, a **Version packages** PR is opened automatically; merging it bumps the version, creates a GitHub Release, and triggers npm publish.

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure your code follows the existing code style
3. Add tests for new functionality
4. Update relevant documentation
5. Link any related issues

## Reporting Issues

When reporting issues, please include:
- OpenClaw version
- Node.js version
- Steps to reproduce
- Expected behavior
- Actual behavior

## Security Issues

Please report security issues directly to security@censgate.com rather than creating a public issue.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

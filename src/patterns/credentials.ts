import type { EntityPattern } from "../types.js";

export const credentialPatterns: EntityPattern[] = [
  {
    name: "aws_access_key",
    category: "credentials",
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    description: "AWS Access Key IDs",
  },
  {
    name: "aws_secret_key",
    category: "credentials",
    pattern: /\b[A-Za-z0-9/+=]{40}\b/g,
    description: "AWS Secret Access Keys",
  },
  {
    name: "github_token",
    category: "credentials",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/g,
    description: "GitHub tokens",
  },
  {
    name: "generic_api_key",
    category: "credentials",
    pattern:
      /\b(?:api[_-]?key|apikey|api[_-]?secret|api[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})/gi,
    description: "Generic API keys in key=value format",
  },
  {
    name: "bearer_token",
    category: "credentials",
    pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi,
    description: "Bearer tokens",
  },
  {
    name: "private_key",
    category: "credentials",
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    description: "Private key headers",
  },
  {
    name: "jwt",
    category: "credentials",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    description: "JSON Web Tokens",
  },
  {
    name: "slack_token",
    category: "credentials",
    pattern: /\bxox[bporas]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g,
    description: "Slack tokens",
  },
];

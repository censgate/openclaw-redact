import type { EntityPattern } from "../types.js";

export const financialPatterns: EntityPattern[] = [
  {
    name: "credit_card",
    category: "financial",
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    description: "Credit card numbers",
  },
  {
    name: "iban",
    category: "financial",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?\d{0,16})\b/g,
    description: "International Bank Account Numbers",
  },
  {
    name: "routing_number",
    category: "financial",
    pattern: /\b\d{9}\b/g,
    description: "US bank routing numbers",
  },
  {
    name: "crypto_btc",
    category: "financial",
    pattern: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
    description: "Bitcoin addresses",
  },
  {
    name: "crypto_eth",
    category: "financial",
    pattern: /\b0x[a-fA-F0-9]{40}\b/g,
    description: "Ethereum addresses",
  },
];

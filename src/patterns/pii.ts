import type { EntityPattern } from "../types.js";

export const piiPatterns: EntityPattern[] = [
  {
    name: "email",
    category: "pii",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    description: "Email addresses",
  },
  {
    name: "phone_us",
    category: "pii",
    pattern:
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g,
    description: "US phone numbers",
  },
  {
    name: "ssn",
    category: "pii",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    description: "US Social Security Numbers",
  },
  {
    name: "ip_address",
    category: "pii",
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    description: "IPv4 addresses",
  },
  {
    name: "date_of_birth",
    category: "pii",
    pattern:
      /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
    description: "Dates of birth (MM/DD/YYYY)",
  },
  {
    name: "passport",
    category: "pii",
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
    description: "Passport numbers",
  },
  {
    name: "drivers_license",
    category: "pii",
    pattern: /\b[A-Z]\d{7,14}\b/g,
    description: "Driver's license numbers",
  },
];

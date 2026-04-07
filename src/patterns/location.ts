import type { EntityPattern } from "../types.js";

export const locationPatterns: EntityPattern[] = [
  {
    name: "zip_code",
    category: "location",
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    description: "US ZIP codes",
  },
  {
    name: "coordinates",
    category: "location",
    pattern:
      /\b-?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?),\s*-?(?:1[0-7]\d(?:\.\d+)?|180(?:\.0+)?|\d{1,2}(?:\.\d+)?)\b/g,
    description: "GPS coordinates (lat, lng)",
  },
  {
    name: "us_address",
    category: "location",
    pattern:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s*){1,3}(?:St|Ave|Blvd|Dr|Ln|Rd|Ct|Way|Pl|Cir)\.?\b/g,
    description: "US street addresses",
  },
];

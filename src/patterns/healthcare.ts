import type { EntityPattern } from "../types.js";

export const healthcarePatterns: EntityPattern[] = [
  {
    name: "mrn",
    category: "healthcare",
    pattern: /\bMRN[:\s#-]*\d{6,10}\b/gi,
    description: "Medical Record Numbers",
  },
  {
    name: "npi",
    category: "healthcare",
    pattern: /\bNPI[:\s#-]*\d{10}\b/gi,
    description: "National Provider Identifiers",
  },
  {
    name: "dea_number",
    category: "healthcare",
    pattern: /\b[ABCDFGHJKMbcdfghjkm][A-Za-z]\d{7}\b/g,
    description: "DEA registration numbers",
  },
  {
    name: "icd_code",
    category: "healthcare",
    pattern: /\b[A-TV-Z]\d{2}(?:\.\d{1,4})?\b/g,
    description: "ICD-10 diagnosis codes",
  },
];

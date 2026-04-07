import type { EntityCategory, EntityPattern } from "../types.js";
import { piiPatterns } from "./pii.js";
import { financialPatterns } from "./financial.js";
import { credentialPatterns } from "./credentials.js";
import { healthcarePatterns } from "./healthcare.js";
import { locationPatterns } from "./location.js";

const categoryMap: Record<EntityCategory, EntityPattern[]> = {
  pii: piiPatterns,
  financial: financialPatterns,
  credentials: credentialPatterns,
  healthcare: healthcarePatterns,
  location: locationPatterns,
  custom: [],
};

export function getPatterns(categories: EntityCategory[]): EntityPattern[] {
  return categories.flatMap((cat) => categoryMap[cat] ?? []);
}

export function getAllPatterns(): EntityPattern[] {
  return Object.values(categoryMap).flat();
}

export {
  piiPatterns,
  financialPatterns,
  credentialPatterns,
  healthcarePatterns,
  locationPatterns,
};

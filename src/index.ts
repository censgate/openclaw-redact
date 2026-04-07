export { redact } from "./redactor.js";
export { restore } from "./restorer.js";
export { detect } from "./detector.js";
export { OpenClawRedactPlugin } from "./plugin.js";
export { resolveConfig } from "./config.js";
export {
  getPatterns,
  getAllPatterns,
  piiPatterns,
  financialPatterns,
  credentialPatterns,
  healthcarePatterns,
  locationPatterns,
} from "./patterns/index.js";
export type {
  RedactionMode,
  EntityCategory,
  EntityPattern,
  DetectedEntity,
  RedactionToken,
  RedactionResult,
  DetectionResult,
  RedactOptions,
  PluginConfig,
  OpenClawHookContext,
  OpenClawHookResult,
} from "./types.js";

import { createHash } from "node:crypto";

export interface AuditEvent {
  step: string;
  payload: unknown;
}

export interface ChainedAuditEntry {
  step: string;
  payloadDigest: string;
  chainHash: string;
}

/**
 * Sequential hash chain over hook events (verification-side only).
 */
export class AuditChain {
  private readonly events: AuditEvent[] = [];
  private prev = "genesis";

  record(step: string, payload: unknown): void {
    this.events.push({ step, payload });
  }

  digestPayload(payload: unknown): string {
    const json = stableStringify(payload);
    return createHash("sha256").update(json, "utf8").digest("hex");
  }

  /**
   * Returns chained entries; chain is invalid if any step is tampered with.
   */
  finalize(): ChainedAuditEntry[] {
    const out: ChainedAuditEntry[] = [];
    for (const ev of this.events) {
      const payloadDigest = this.digestPayload(ev.payload);
      const chainInput = `${this.prev}|${ev.step}|${payloadDigest}`;
      const chainHash = createHash("sha256")
        .update(chainInput, "utf8")
        .digest("hex");
      out.push({ step: ev.step, payloadDigest, chainHash });
      this.prev = chainHash;
    }
    return out;
  }

  get length(): number {
    return this.events.length;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

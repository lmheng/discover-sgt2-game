import { SCHEMA_VERSION, type GameplayRecord, type InterestRecord, type ResearchRecord } from "./schema";
import type { ResearchAnswers } from "@/lib/research/schema";

/** Builders that stamp the shared envelope onto every record. */

export interface Envelope {
  visitId: string;
  eventCode: string;
  source: "kiosk" | "mobile";
}

/** Random v4 UUID. Falls back to getRandomValues outside secure contexts (e.g. plain-HTTP LAN). */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function base(env: Envelope) {
  return {
    recordId: newId(),
    visitId: env.visitId,
    eventCode: env.eventCode,
    source: env.source,
    consentStatus: "implied_by_play" as const,
    schemaVersion: SCHEMA_VERSION,
    recordedAt: new Date().toISOString(),
  };
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type GameplayBody = DistributiveOmit<GameplayRecord, keyof ReturnType<typeof base> | "stream">;

export function gameplayRecord(env: Envelope, body: GameplayBody): GameplayRecord {
  return { ...base(env), stream: "gameplay", ...body } as GameplayRecord;
}

/** Research records are cumulative snapshots; the latest per visit wins. */
export function researchRecord(env: Envelope, answers: ResearchAnswers): ResearchRecord {
  return { ...base(env), stream: "research", answers };
}

export function interestRecord(env: Envelope, type: InterestRecord["type"]): InterestRecord {
  return { ...base(env), stream: "interest", type };
}

import { z } from "zod";
import { missionIds } from "@/lib/game/types";
import { researchAnswersSchema } from "@/lib/research/schema";

/**
 * Three deliberately separate record streams:
 *  - gameplay:  arcade telemetry (never used to infer translation needs)
 *  - research:  anonymous self-reported answers
 *  - interest:  explicit product-interest actions
 *
 * All objects are strict: unknown keys are rejected, which stops extra fields
 * (e.g. names or emails) from reaching storage. Optional follow-up
 * registration happens in FormSG and is never stored here.
 */

export const SCHEMA_VERSION = 1 as const;

const uuid = z.uuid();
const baseShape = {
  recordId: uuid,
  visitId: uuid,
  eventCode: z.string().regex(/^[a-z0-9-]{3,40}$/),
  source: z.enum(["kiosk", "mobile"]),
  consentStatus: z.literal("implied_by_play"),
  schemaVersion: z.literal(SCHEMA_VERSION),
  recordedAt: z.iso.datetime(),
};

const gameplayShape = {
  ...baseShape,
  stream: z.literal("gameplay"),
  gameSessionId: uuid,
  attempt: z.number().int().min(1).max(50),
};

const score = z.number().int().min(0).max(100_000);
const durationMs = z.number().int().min(0).max(30 * 60_000);

export const gameplayRecordSchema = z.discriminatedUnion("type", [
  z.strictObject({ ...gameplayShape, type: z.literal("session_started") }),
  z.strictObject({
    ...gameplayShape,
    type: z.literal("mission_completed"),
    mission: z.enum(missionIds),
    score,
    success: z.boolean(),
    durationMs,
  }),
  z.strictObject({
    ...gameplayShape,
    type: z.literal("session_completed"),
    totalScore: score,
    tier: z.enum(["rookie", "specialist", "master"]),
    durationMs,
    missionsSucceeded: z.number().int().min(0).max(3),
  }),
  z.strictObject({
    ...gameplayShape,
    type: z.literal("session_abandoned"),
    reason: z.enum(["idle_reset", "staff_reset", "exit"]),
    stepKind: z.string().max(32),
  }),
]);
export type GameplayRecord = z.infer<typeof gameplayRecordSchema>;

export const researchRecordSchema = z.strictObject({
  ...baseShape,
  stream: z.literal("research"),
  answers: researchAnswersSchema,
});
export type ResearchRecord = z.infer<typeof researchRecordSchema>;

export const interestTypes = [
  "interest_expressed",
  "interest_declined",
  "formsg_qr_shown",
  "formsg_link_opened",
] as const;

export const interestRecordSchema = z.strictObject({
  ...baseShape,
  stream: z.literal("interest"),
  type: z.enum(interestTypes),
});
export type InterestRecord = z.infer<typeof interestRecordSchema>;

export const anyRecordSchema = z.union([gameplayRecordSchema, researchRecordSchema, interestRecordSchema]);
export type AnyRecord = GameplayRecord | ResearchRecord | InterestRecord;
export type StreamName = AnyRecord["stream"];
export const streamNames: readonly StreamName[] = ["gameplay", "research", "interest"];

export const MAX_RECORDS_PER_BATCH = 50;
export const MAX_BODY_BYTES = 64 * 1024;

export const ingestPayloadSchema = z.strictObject({
  records: z.array(z.unknown()).min(1).max(MAX_RECORDS_PER_BATCH),
});

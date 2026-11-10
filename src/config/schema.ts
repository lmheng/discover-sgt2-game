import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Event configuration: one JSON file per event / roadshow.            */
/* ------------------------------------------------------------------ */

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const eventConfigSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/, "lowercase, digits and dashes only"),
  name: z.string().min(1),
  shortName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().default("Asia/Singapore"),
  hours: z.strictObject({ setup: hhmm, open: hhmm, close: hhmm }),
  /** Official FormSG registration link. Empty string = not yet confirmed (CTA shows a placeholder). */
  formsgUrl: z.union([z.literal(""), z.url({ protocol: /^https$/ })]),
  /** Staff-facing GovEntry reminder copy. The game never renders a GovEntry QR code. */
  govEntryReminder: z.string().min(1),
  researchEnabled: z.boolean(),
  missions: z.strictObject({
    rush: z.strictObject({ durationMs: z.number().int().min(10_000).max(90_000) }),
    detective: z.strictObject({ durationMs: z.number().int().min(10_000).max(90_000) }),
    launch: z.strictObject({ durationMs: z.number().int().min(10_000).max(90_000) }),
  }),
  kiosk: z.strictObject({
    idleWarningMs: z.number().int().min(10_000),
    idleCountdownMs: z.number().int().min(3_000),
    resultsTimeoutMs: z.number().int().min(10_000),
    /** Deters casual exits from kiosk mode. Not a security control. */
    staffPin: z.string().regex(/^\d{4,8}$/),
  }),
});
export type EventConfig = z.infer<typeof eventConfigSchema>;

/* ------------------------------------------------------------------ */
/* Mission content                                                     */
/* ------------------------------------------------------------------ */

export const destinationIds = ["together", "polyglot", "api"] as const;
export type DestinationId = (typeof destinationIds)[number];

export const rushContentSchema = z.strictObject({
  destinations: z
    .array(
      z.strictObject({
        id: z.enum(destinationIds),
        product: z.string(),
        job: z.string(),
        key: z.string().length(1),
      }),
    )
    .length(3),
  cards: z
    .array(
      z.strictObject({
        id: z.string(),
        text: z.string().min(5).max(90),
        tag: z.string().max(24),
        answer: z.enum(destinationIds),
        why: z.string().max(120),
      }),
    )
    .min(9),
});
export type RushContent = z.infer<typeof rushContentSchema>;
export type RushCard = RushContent["cards"][number];

export const languageIds = ["zh", "ms", "ta"] as const;
export type LanguageId = (typeof languageIds)[number];

const segmentSchema = z.union([
  z.strictObject({ text: z.string() }),
  z.strictObject({ term: z.string(), odd: z.boolean().optional() }),
]);
export type Segment = z.infer<typeof segmentSchema>;

export const reviewStatusSchema = z.enum([
  "illustrative-pending-review",
  "reviewed-approved",
]);

export const detectiveContentSchema = z.strictObject({
  rounds: z
    .array(
      z.strictObject({
        id: z.string(),
        agency: z.string(),
        title: z.string(),
        language: z.enum(languageIds),
        languageLabel: z.string(),
        glossary: z.strictObject({ en: z.string(), target: z.string() }),
        english: z.string(),
        target: z.array(segmentSchema).min(3),
        reviewStatus: reviewStatusSchema,
        explanation: z.string(),
      }),
    )
    .min(3),
});
export type DetectiveContent = z.infer<typeof detectiveContentSchema>;
export type DetectiveRound = DetectiveContent["rounds"][number];

export const launchContentSchema = z.strictObject({
  agency: z.string(),
  announcement: z.string(),
  lanes: z
    .array(
      z.strictObject({
        id: z.enum(languageIds),
        label: z.string(),
        sample: z.string(),
        issue: z.string(),
      }),
    )
    .length(3),
  reviewers: z.array(z.strictObject({ id: z.string(), name: z.string() })).min(1).max(3),
  reviewStatus: reviewStatusSchema,
  timings: z.strictObject({
    translateMs: z.number().int().positive(),
    reviewMs: z.number().int().positive(),
    unreviewedPenaltyMs: z.number().int().nonnegative(),
  }),
});
export type LaunchContent = z.infer<typeof launchContentSchema>;

/* ------------------------------------------------------------------ */
/* Research options                                                    */
/* ------------------------------------------------------------------ */

const optionSchema = z.strictObject({
  id: z.string().regex(/^[a-z_]+$/),
  label: z.string(),
  hint: z.string().optional(),
  /** Exclusive options (e.g. "none") cannot be combined with others. */
  exclusive: z.boolean().optional(),
  /** Pinned options stay at the end when the list is shuffled. */
  pinned: z.boolean().optional(),
});
export type ResearchOption = z.infer<typeof optionSchema>;

export const researchQuestionIds = [
  "workFunction",
  "frequency",
  "contentTypes",
  "challenges",
  "tools",
  "capability",
] as const;
export type ResearchQuestionId = (typeof researchQuestionIds)[number];

export const researchContentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  questions: z.strictObject({
    workFunction: z.strictObject({ kind: z.literal("single"), prompt: z.string(), options: z.array(optionSchema) }),
    frequency: z.strictObject({ kind: z.literal("single"), prompt: z.string(), options: z.array(optionSchema) }),
    contentTypes: z.strictObject({ kind: z.literal("multi"), prompt: z.string(), options: z.array(optionSchema) }),
    challenges: z.strictObject({ kind: z.literal("multi"), prompt: z.string(), options: z.array(optionSchema) }),
    tools: z.strictObject({ kind: z.literal("multi"), prompt: z.string(), options: z.array(optionSchema) }),
    capability: z.strictObject({ kind: z.literal("single"), prompt: z.string(), options: z.array(optionSchema) }),
  }),
});
export type ResearchContent = z.infer<typeof researchContentSchema>;

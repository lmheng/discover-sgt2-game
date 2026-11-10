import { z } from "zod";
import { researchContent } from "@/config";
import type { ResearchOption, ResearchQuestionId } from "@/config/schema";

/**
 * Structured research response schema and validation rules.
 *
 * Every question is either:
 *  - not reached (key absent),
 *  - answered (value / values from the fixed option list),
 *  - skipped (the participant chose Skip; this is NOT the same as "none"),
 *  - not_applicable (only contentTypes, and only when frequency = "never").
 * There is no free text anywhere.
 */

const optionIds = (q: ResearchQuestionId) => researchContent.questions[q].options.map((o) => o.id);
const exclusiveIds = (q: ResearchQuestionId) =>
  researchContent.questions[q].options.filter((o: ResearchOption) => o.exclusive).map((o) => o.id);

const enumOf = (q: ResearchQuestionId) => {
  const ids = optionIds(q);
  return z.string().refine((v) => ids.includes(v), { message: `Unknown option for ${q}` });
};

const skipped = z.strictObject({ status: z.literal("skipped") });
const notApplicable = z.strictObject({ status: z.literal("not_applicable") });

function single(q: ResearchQuestionId) {
  return z.discriminatedUnion("status", [z.strictObject({ status: z.literal("answered"), value: enumOf(q) }), skipped]);
}

function multi(q: ResearchQuestionId, allowNotApplicable = false) {
  const exclusive = exclusiveIds(q);
  const max = optionIds(q).length;
  const answered = z
    .strictObject({
      status: z.literal("answered"),
      values: z.array(enumOf(q)).min(0).max(max),
    })
    .refine((a) => new Set(a.values).size === a.values.length, { message: "Duplicate values" })
    .refine((a) => !(a.values.length > 1 && a.values.some((v) => exclusive.includes(v))), {
      message: "Exclusive option combined with others",
    });
  return allowNotApplicable ? z.union([answered, skipped, notApplicable]) : z.union([answered, skipped]);
}

export const researchAnswersSchema = z
  .strictObject({
    workFunction: single("workFunction").optional(),
    frequency: single("frequency").optional(),
    contentTypes: multi("contentTypes", true).optional(),
    challenges: multi("challenges").optional(),
    tools: multi("tools").optional(),
    capability: single("capability").optional(),
  })
  .refine(
    (a) =>
      a.contentTypes?.status !== "not_applicable" ||
      (a.frequency?.status === "answered" && a.frequency.value === "never"),
    { message: "contentTypes can only be not_applicable when frequency is never", path: ["contentTypes"] },
  );

export type ResearchAnswers = z.infer<typeof researchAnswersSchema>;
export type SingleAnswer = NonNullable<ResearchAnswers["workFunction"]>;
export type MultiAnswer = NonNullable<ResearchAnswers["challenges"]>;

/** True when at least one question has a real (answered) response. */
export function hasSubstantiveAnswer(a: ResearchAnswers): boolean {
  return Object.values(a).some((v) => v !== undefined && v.status === "answered");
}

/**
 * Normalises a multi-select pick list: removes duplicates, and if an
 * exclusive option was chosen last, keeps it alone (and vice versa).
 */
export function toggleMulti(q: ResearchQuestionId, current: readonly string[], id: string): string[] {
  const exclusive = exclusiveIds(q);
  if (current.includes(id)) return current.filter((v) => v !== id);
  if (exclusive.includes(id)) return [id];
  return [...current.filter((v) => !exclusive.includes(v)), id];
}

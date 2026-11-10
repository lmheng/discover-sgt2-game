import { describe, expect, it } from "vitest";
import { researchAnswersSchema, toggleMulti, hasSubstantiveAnswer } from "@/lib/research/schema";
import { anyRecordSchema } from "@/lib/analytics/schema";

const env = {
  recordId: "8f1c2a4e-1b2c-4d3e-8f9a-0b1c2d3e4f50",
  visitId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  eventCode: "discover-2026",
  source: "kiosk",
  consentStatus: "implied_by_play",
  schemaVersion: 1,
  recordedAt: "2026-11-27T03:00:00.000Z",
};

describe("research answers validation", () => {
  it("accepts a complete valid response", () => {
    const r = researchAnswersSchema.safeParse({
      workFunction: { status: "answered", value: "communications" },
      frequency: { status: "answered", value: "weekly" },
      contentTypes: { status: "answered", values: ["website_pages", "public_notices"] },
      challenges: { status: "answered", values: ["terminology", "turnaround"] },
      tools: { status: "skipped" },
      capability: { status: "answered", value: "glossary" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown options, duplicates and free text", () => {
    expect(researchAnswersSchema.safeParse({ workFunction: { status: "answered", value: "astronaut" } }).success).toBe(false);
    expect(researchAnswersSchema.safeParse({ challenges: { status: "answered", values: ["cost", "cost"] } }).success).toBe(false);
    expect(researchAnswersSchema.safeParse({ tools: { status: "answered", values: ["vendors"], note: "my email is x@y.sg" } }).success).toBe(false);
    expect(researchAnswersSchema.safeParse({ comments: "anything" }).success).toBe(false);
  });

  it("enforces exclusive 'none'", () => {
    expect(researchAnswersSchema.safeParse({ challenges: { status: "answered", values: ["none", "cost"] } }).success).toBe(false);
    expect(researchAnswersSchema.safeParse({ challenges: { status: "answered", values: ["none"] } }).success).toBe(true);
  });

  it("allows contentTypes not_applicable only when frequency is never", () => {
    expect(
      researchAnswersSchema.safeParse({
        frequency: { status: "answered", value: "never" },
        contentTypes: { status: "not_applicable" },
      }).success,
    ).toBe(true);
    expect(
      researchAnswersSchema.safeParse({
        frequency: { status: "answered", value: "daily" },
        contentTypes: { status: "not_applicable" },
      }).success,
    ).toBe(false);
  });

  it("toggleMulti keeps exclusive options alone", () => {
    expect(toggleMulti("challenges", ["cost"], "none")).toEqual(["none"]);
    expect(toggleMulti("challenges", ["none"], "cost")).toEqual(["cost"]);
    expect(toggleMulti("challenges", ["cost", "terminology"], "cost")).toEqual(["terminology"]);
  });

  it("skips are not substantive answers", () => {
    expect(hasSubstantiveAnswer({ workFunction: { status: "skipped" } })).toBe(false);
    expect(hasSubstantiveAnswer({ workFunction: { status: "answered", value: "operations" } })).toBe(true);
  });
});

describe("record envelope", () => {
  it("rejects personal-data fields and wrong consent status", () => {
    const ok = { ...env, stream: "interest", type: "interest_expressed" };
    expect(anyRecordSchema.safeParse(ok).success).toBe(true);
    expect(anyRecordSchema.safeParse({ ...ok, email: "a@b.gov.sg" }).success).toBe(false);
    expect(anyRecordSchema.safeParse({ ...ok, ip: "10.0.0.1" }).success).toBe(false);
    expect(anyRecordSchema.safeParse({ ...ok, consentStatus: "unknown" }).success).toBe(false);
    expect(anyRecordSchema.safeParse({ ...ok, visitId: "not-a-uuid" }).success).toBe(false);
  });
});

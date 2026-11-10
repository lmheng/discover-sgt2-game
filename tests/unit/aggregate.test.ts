import { describe, expect, it } from "vitest";
import { aggregate, latestResearchPerVisit, ratio, sgDate, MIN_REPORTABLE_N } from "@/lib/admin/aggregate";
import { generateDemoData } from "@/lib/admin/demoData";
import { anyRecordSchema, type GameplayRecord, type InterestRecord, type ResearchRecord } from "@/lib/analytics/schema";

let n = 0;
const uuid = () => {
  n++;
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
};
const base = (visitId: string, recordedAt = "2026-11-27T03:00:00.000Z") => ({
  recordId: uuid(),
  visitId,
  eventCode: "discover-2026",
  source: "kiosk" as const,
  consentStatus: "implied_by_play" as const,
  schemaVersion: 1 as const,
  recordedAt,
});
const started = (v: string, s: string): GameplayRecord => ({ ...base(v), stream: "gameplay", type: "session_started", gameSessionId: s, attempt: 1 });
const completed = (v: string, s: string, durationMs = 100_000): GameplayRecord => ({
  ...base(v),
  stream: "gameplay",
  type: "session_completed",
  gameSessionId: s,
  attempt: 1,
  totalScore: 2000,
  tier: "specialist",
  durationMs,
  missionsSucceeded: 2,
});
const research = (v: string, answers: ResearchRecord["answers"], at?: string): ResearchRecord => ({ ...base(v, at), stream: "research", answers });
const interest = (v: string, type: InterestRecord["type"]): InterestRecord => ({ ...base(v), stream: "interest", type });

describe("aggregate", () => {
  const v1 = uuid(), v2 = uuid(), v3 = uuid();
  const s1 = uuid(), s1b = uuid(), s2 = uuid(), s3 = uuid();
  const gameplay = [
    started(v1, s1), completed(v1, s1, 90_000),
    started(v1, s1b), completed(v1, s1b, 110_000), // replay by the same visitor
    started(v2, s2), completed(v2, s2, 100_000),
    started(v3, s3), // abandoned
  ];
  const researchRows = [
    research(v1, { workFunction: { status: "answered", value: "communications" } }, "2026-11-27T03:00:00.000Z"),
    research(
      v1,
      {
        workFunction: { status: "answered", value: "communications" },
        frequency: { status: "answered", value: "daily" },
        challenges: { status: "answered", values: ["terminology", "cost"] },
      },
      "2026-11-27T03:01:00.000Z",
    ),
    research(v2, {
      workFunction: { status: "answered", value: "frontline" },
      frequency: { status: "answered", value: "never" },
      contentTypes: { status: "not_applicable" },
      challenges: { status: "answered", values: ["none"] },
    }),
    research(v3, { workFunction: { status: "skipped" }, frequency: { status: "skipped" } }),
  ];
  const interestRows = [interest(v1, "interest_expressed"), interest(v1, "formsg_link_opened"), interest(v2, "interest_declined")];
  const s = aggregate({ gameplay, research: researchRows, interest: interestRows, leads: [] });

  it("keeps visitors, sessions, completions and respondents distinct", () => {
    expect(s.participation.uniqueVisitors).toBe(3);
    expect(s.participation.sessionsStarted).toBe(4);
    expect(s.participation.gamesCompleted).toBe(3);
    expect(s.participation.visitorsCompleted).toBe(2);
    expect(s.participation.completionRate).toEqual({ count: 3, n: 4, pct: 75 });
    expect(s.participation.avgPlayDurationMs).toBe(100_000);
    // v1 answered twice (cumulative) but counts once; v3 only skipped, so is not a respondent.
    expect(s.participation.researchRespondents).toBe(2);
    expect(s.participation.researchParticipationRate).toEqual({ count: 2, n: 3, pct: 66.7 });
  });

  it("uses answered-only denominators and reports skips separately", () => {
    const ch = s.needs.distributions.find((d) => d.question === "challenges")!;
    expect(ch.answered).toBe(2);
    expect(ch.options.find((o) => o.id === "terminology")).toMatchObject({ count: 1, n: 2, pct: 50 });
    expect(s.needs.noChallenges).toEqual({ count: 1, n: 2, pct: 50 });
    const ct = s.needs.distributions.find((d) => d.question === "contentTypes")!;
    expect(ct.notApplicable).toBe(1);
    expect(ct.answered).toBe(0);
  });

  it("engagement counts distinct visitors and leaves leads empty until entered", () => {
    expect(s.engagement.interested).toBe(1);
    expect(s.engagement.declined).toBe(1);
    expect(s.engagement.formsgLinkOpened).toBe(1);
    expect(s.engagement.onboardingLeads).toBeNull();
    expect(s.engagement.interestByFunction.find((o) => o.id === "communications")).toMatchObject({ count: 1, n: 1 });
  });

  it("flags samples too small to summarise", () => {
    expect(s.executiveSummary.some((l) => l.includes(`minimum ${MIN_REPORTABLE_N}`))).toBe(true);
    expect(s.executiveSummary.at(-1)).toMatch(/Self-selected sample/);
  });

  it("research filters narrow needs and interest only", () => {
    const f = aggregate({ gameplay, research: researchRows, interest: interestRows, leads: [] }, { workFunction: "frontline" });
    expect(f.researchFiltersActive).toBe(true);
    expect(f.participation.uniqueVisitors).toBe(3);
    expect(f.engagement.interested).toBe(0);
    expect(f.needs.distributions.find((d) => d.question === "workFunction")!.answered).toBe(1);
  });

  it("date filters use Singapore time", () => {
    expect(sgDate("2026-11-26T16:30:00.000Z")).toBe("2026-11-27");
    const none = aggregate({ gameplay, research: researchRows, interest: interestRows, leads: [] }, { from: "2026-11-28" });
    expect(none.participation.uniqueVisitors).toBe(0);
    expect(none.participation.completionRate.pct).toBeNull();
  });

  it("latest research per visit wins", () => {
    const latest = latestResearchPerVisit(researchRows);
    expect(latest).toHaveLength(3);
    expect(latest.find((r) => r.visitId === v1)!.answers.frequency).toEqual({ status: "answered", value: "daily" });
  });

  it("ratio guards division by zero", () => {
    expect(ratio(0, 0)).toEqual({ count: 0, n: 0, pct: null });
  });
});

describe("demo data", () => {
  it("is synthetic, valid against the schema, and labelled with a demo event code", () => {
    const d = generateDemoData(30);
    for (const r of [...d.gameplay, ...d.research, ...d.interest]) {
      expect(anyRecordSchema.safeParse(r).success).toBe(true);
      expect(r.eventCode).toBe("demo-synthetic");
    }
    expect(aggregate(d).participation.uniqueVisitors).toBe(30);
  });
});

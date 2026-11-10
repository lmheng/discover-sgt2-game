import { describe, expect, it } from "vitest";
import { buildRunPlan, currentStep, flowReducer, type FlowState } from "@/lib/game/flow";
import { summarizeRun } from "@/lib/game/badges";
import type { MissionResult } from "@/lib/game/types";

const missions = ["rush", "detective", "launch"] as const;

describe("run plan", () => {
  it("weaves research interludes after each mission", () => {
    const plan = buildRunPlan({ missions, researchEnabled: true, researchDone: new Set() });
    expect(
      plan.map((p) => (p.kind === "interlude" ? `i:${p.question}` : p.kind === "desk" ? "desk" : `${p.kind}:${p.mission}`)),
    ).toEqual([
      "desk",
      "intro:rush", "play:rush", "missionResult:rush", "i:contentTypes",
      "intro:detective", "play:detective", "missionResult:detective", "i:challenges",
      "intro:launch", "play:launch", "missionResult:launch", "i:tools",
      "i:capability",
    ]);
  });

  it("omits research when disabled or already done this visit", () => {
    expect(
      buildRunPlan({ missions, researchEnabled: false, researchDone: new Set() }).some(
        (s) => s.kind === "interlude" || s.kind === "desk",
      ),
    ).toBe(false);
    const replay = buildRunPlan({
      missions,
      researchEnabled: true,
      researchDone: new Set(["desk", "contentTypes", "challenges", "tools", "capability"]),
    });
    expect(replay).toHaveLength(9);
  });
});

describe("flowReducer", () => {
  it("walks attract, title, run, results, interest, thanks, attract", () => {
    const plan = buildRunPlan({ missions: ["rush"], researchEnabled: false, researchDone: new Set() });
    let s: FlowState = { phase: "attract" };
    s = flowReducer(s, { type: "wake" });
    expect(s.phase).toBe("title");
    s = flowReducer(s, { type: "begin", plan });
    expect(currentStep(s)).toEqual({ kind: "intro", mission: "rush" });
    s = flowReducer(s, { type: "next" });
    s = flowReducer(s, { type: "next" });
    s = flowReducer(s, { type: "next" });
    expect(s.phase).toBe("results");
    s = flowReducer(s, { type: "showInterest" });
    expect(s.phase).toBe("interest");
    s = flowReducer(s, { type: "finish" });
    expect(s.phase).toBe("thanks");
    expect(flowReducer(s, { type: "reset" })).toEqual({ phase: "attract" });
  });

  it("skips steps via predicate and counts attempts on replay", () => {
    const plan = buildRunPlan({ missions: ["rush"], researchEnabled: true, researchDone: new Set() });
    let s = flowReducer({ phase: "title" }, { type: "begin", plan });
    s = flowReducer(s, { type: "next", skip: (st) => st.kind === "intro" });
    expect(currentStep(s)).toEqual({ kind: "play", mission: "rush" });
    s = flowReducer({ phase: "results", attempt: 1 }, { type: "replay", plan });
    expect(s.phase === "run" && s.attempt).toBe(2);
  });

  it("ignores out-of-phase actions", () => {
    const s: FlowState = { phase: "attract" };
    expect(flowReducer(s, { type: "next" })).toBe(s);
    expect(flowReducer(s, { type: "finish" })).toBe(s);
  });
});

describe("badges", () => {
  const r = (
    mission: MissionResult["mission"],
    score: number,
    success: boolean,
    stats: Record<string, number> = {},
  ): MissionResult => ({ mission, score, success, durationMs: 1000, bestStreak: 2, stats });

  it("awards mission badges and a tier", () => {
    const s = summarizeRun([
      r("rush", 3000, true),
      r("detective", 1200, true),
      r("launch", 900, true, { unreviewedPublishAttempts: 0 }),
    ]);
    expect(s.totalScore).toBe(5100);
    expect(s.tier).toBe("master");
    expect(s.badges.map((b) => b.id)).toEqual(["routing-ranger", "term-sleuth", "launch-lead", "review-champion"]);
  });

  it("withholds Review Champion after an unreviewed publish", () => {
    const s = summarizeRun([r("launch", 900, true, { unreviewedPublishAttempts: 1 })]);
    expect(s.badges.map((b) => b.id)).toEqual(["launch-lead"]);
  });
});

import { describe, expect, it } from "vitest";
import { launchContent } from "@/config";
import { SCORING } from "@/lib/game/scoring";
import { initLaunch, launchReducer, summarizeLaunch, type LaunchState } from "@/lib/game/missions/launch";
import type { LanguageId } from "@/config/schema";

const D = 30_000;
const tickFor = (s: LaunchState, ms: number) => {
  let st = s;
  for (let t = 0; t < ms; t += 50) st = launchReducer(st, { type: "tick", dtMs: 50 });
  return st;
};
const lane = (s: LaunchState, id: LanguageId) => s.lanes.find((l) => l.id === id)!;

describe("Save the Launch reducer", () => {
  it("flags exactly one lane, deterministically", () => {
    const a = initLaunch(launchContent, D, 77);
    expect(a.lanes.filter((l) => l.flagged)).toHaveLength(1);
    expect(initLaunch(launchContent, D, 77).lanes.map((l) => l.flagged)).toEqual(a.lanes.map((l) => l.flagged));
  });

  it("blocks publishing an unreviewed AI translation with a time penalty", () => {
    let s = initLaunch(launchContent, D, 1);
    s = launchReducer(s, { type: "runSgt", laneId: "zh" });
    s = tickFor(s, launchContent.timings.translateMs + 50);
    expect(lane(s, "zh").stage).toBe("translated");
    const t = s.elapsedMs;
    s = launchReducer(s, { type: "publish", laneId: "zh" });
    expect(lane(s, "zh").stage).toBe("translated");
    expect(s.unreviewedPublishAttempts).toBe(1);
    expect(s.elapsedMs).toBe(t + launchContent.timings.unreviewedPenaltyMs);
    expect(s.feedback?.message).toMatch(/human review/i);
  });

  it("reviewers are a limited resource", () => {
    let s = initLaunch(launchContent, D, 1);
    for (const id of ["zh", "ms", "ta"] as const) s = launchReducer(s, { type: "runSgt", laneId: id });
    s = tickFor(s, launchContent.timings.translateMs + 50);
    s = launchReducer(s, { type: "assignReviewer", laneId: "zh" });
    s = launchReducer(s, { type: "assignReviewer", laneId: "ms" });
    s = launchReducer(s, { type: "assignReviewer", laneId: "ta" });
    expect(lane(s, "ta").stage).toBe("translated");
    expect(s.feedback?.message).toMatch(/busy/i);
    expect(s.reviewers.every((r) => r.laneId !== null)).toBe(true);
  });

  it("cannot review before running SGT", () => {
    const s = launchReducer(initLaunch(launchContent, D, 1), { type: "assignReviewer", laneId: "ms" });
    expect(lane(s, "ms").stage).toBe("draft");
    expect(s.feedback?.message).toMatch(/Run SGT first/);
  });

  it("full successful run: translate, review, fix the flagged lane, publish all", () => {
    let s = initLaunch(launchContent, D, 99);
    const ids = s.lanes.map((l) => l.id);
    for (const id of ids) s = launchReducer(s, { type: "runSgt", laneId: id });
    s = tickFor(s, launchContent.timings.translateMs + 50);
    let guard = 0;
    while (s.status === "playing" && guard++ < 2000) {
      for (const l of s.lanes) {
        if (l.stage === "translated") s = launchReducer(s, { type: "assignReviewer", laneId: l.id });
        if (l.stage === "issue") s = launchReducer(s, { type: "fixIssue", laneId: l.id });
        if (l.stage === "approved") s = launchReducer(s, { type: "publish", laneId: l.id });
      }
      s = launchReducer(s, { type: "tick", dtMs: 50 });
    }
    const r = summarizeLaunch(s);
    expect(r.success).toBe(true);
    expect(r.stats.published).toBe(3);
    expect(r.stats.fixesApplied).toBe(1);
    expect(r.stats.unreviewedPublishAttempts).toBe(0);
    expect(r.stats.completionBonus).toBeGreaterThanOrEqual(SCORING.launchAllPublishedBonus);
    expect(Number.isInteger(r.score)).toBe(true);
  });

  it("times out as a partial result", () => {
    let s = launchReducer(initLaunch(launchContent, D, 3), { type: "runSgt", laneId: "zh" });
    s = tickFor(s, D + 100);
    expect(s.status).toBe("done");
    const r = summarizeLaunch(s);
    expect(r.success).toBe(false);
    expect(r.score).toBe(SCORING.launchTranslated);
  });
});

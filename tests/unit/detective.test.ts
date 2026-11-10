import { describe, expect, it } from "vitest";
import { detectiveContent } from "@/config";
import {
  DETECTIVE_TUNING,
  currentRoundId,
  detectiveReducer,
  hintVisible,
  initDetective,
  summarizeDetective,
  type DetectiveState,
} from "@/lib/game/missions/detective";

const D = 28_000;
const tickFor = (s: DetectiveState, ms: number) => {
  let st = s;
  for (let t = 0; t < ms; t += 50) st = detectiveReducer(st, { type: "tick", dtMs: 50 });
  return st;
};
const odd = (s: DetectiveState) => s.oddIndex[currentRoundId(s)!]!;
const notOdd = (s: DetectiveState) => (odd(s) === 0 ? 1 : 0);

describe("Terminology Detective reducer", () => {
  it("picks a deterministic subset of rounds", () => {
    const a = initDetective(detectiveContent, D, 123);
    expect(a.roundIds).toHaveLength(DETECTIVE_TUNING.roundsPerMission);
    expect(new Set(a.roundIds).size).toBe(a.roundIds.length);
    expect(initDetective(detectiveContent, D, 123).roundIds).toEqual(a.roundIds);
  });

  it("solving a round scores, reveals, then advances", () => {
    let s = tickFor(initDetective(detectiveContent, D, 1), 1000);
    s = detectiveReducer(s, { type: "tap", segmentIndex: odd(s) });
    expect(s.score).toBe(450);
    expect(s.revealing).not.toBeNull();
    const frozen = s.elapsedMs;
    s = tickFor(s, 500);
    expect(s.elapsedMs).toBe(frozen); // clock paused during reveal
    s = detectiveReducer(s, { type: "continue" });
    expect(s.roundIndex).toBe(1);
    expect(s.revealing).toBeNull();
  });

  it("wrong taps cost time, never points, and enable the hint", () => {
    let s = initDetective(detectiveContent, D, 2);
    const first = notOdd(s);
    s = detectiveReducer(s, { type: "tap", segmentIndex: first });
    expect(s.score).toBe(0);
    expect(s.elapsedMs).toBe(DETECTIVE_TUNING.wrongTapPenaltyMs);
    // Tapping the same wrong token twice is not penalised again.
    s = detectiveReducer(s, { type: "tap", segmentIndex: first });
    expect(s.elapsedMs).toBe(DETECTIVE_TUNING.wrongTapPenaltyMs);
    expect(hintVisible(s)).toBe(false);
    const other = [0, 1, 2, 3].find((i) => i !== odd(s) && i !== first)!;
    s = detectiveReducer(s, { type: "tap", segmentIndex: other });
    expect(hintVisible(s)).toBe(true);
  });

  it("shows the hint after the hint delay", () => {
    const s = tickFor(initDetective(detectiveContent, D, 3), DETECTIVE_TUNING.hintAfterMs);
    expect(hintVisible(s)).toBe(true);
  });

  it("completing all rounds ends early with a time bonus", () => {
    let s = initDetective(detectiveContent, D, 4);
    for (let i = 0; i < DETECTIVE_TUNING.roundsPerMission; i++) {
      s = tickFor(s, 1000);
      s = detectiveReducer(s, { type: "tap", segmentIndex: odd(s) });
      s = detectiveReducer(s, { type: "continue" });
    }
    expect(s.status).toBe("done");
    const r = summarizeDetective(s);
    expect(r.success).toBe(true);
    expect(r.stats.solved).toBe(3);
    expect(r.stats.timeBonus).toBe(250); // 28s - 3s used = 25 whole seconds
    // Rounds at streak 1, 2, 3: 450 + 450 + 900 = 1800, plus 250 bonus.
    expect(r.score).toBe(2050);
  });

  it("times out as a failure when nothing is solved", () => {
    const s = tickFor(initDetective(detectiveContent, D, 5), D + 200);
    expect(s.status).toBe("done");
    expect(summarizeDetective(s).success).toBe(false);
  });
});

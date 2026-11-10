import { describe, expect, it } from "vitest";
import { rushContent } from "@/config";
import { RUSH_TUNING, initRush, rushReducer, summarizeRush, type RushState } from "@/lib/game/missions/rush";

const D = 30_000;
const run = (s: RushState, ms: number) => {
  let st = s;
  for (let t = 0; t < ms; t += 50) st = rushReducer(st, { type: "tick", dtMs: 50 });
  return st;
};
const answerFor = (s: RushState, uid?: number) => {
  const card = uid === undefined ? s.active[0]! : s.active.find((c) => c.uid === uid)!;
  return s.answerKey[card.cardId]!;
};

describe("Translation Rush reducer", () => {
  it("is deterministic for a seed", () => {
    expect(initRush(rushContent, D, 42).deck).toEqual(initRush(rushContent, D, 42).deck);
    expect(initRush(rushContent, D, 42).deck).not.toEqual(initRush(rushContent, D, 7).deck);
  });

  it("spawns the first card on the first tick and caps active cards", () => {
    let s = rushReducer(initRush(rushContent, D, 1), { type: "tick", dtMs: 16 });
    expect(s.active).toHaveLength(1);
    s = run(s, 5000);
    expect(s.active.length).toBeLessThanOrEqual(RUSH_TUNING.maxActive);
  });

  it("scores a correct route with combo and resets on a wrong route", () => {
    let s = rushReducer(initRush(rushContent, D, 3), { type: "tick", dtMs: 16 });
    s = rushReducer(s, { type: "route", destination: answerFor(s) });
    expect(s.streak).toBe(1);
    expect(s.score).toBe(150); // full patience -> high speed bonus
    expect(s.feedback?.kind).toBe("correct");

    s = run(s, 2500);
    const card = s.active[0]!;
    const wrong = (["together", "polyglot", "api"] as const).find((d) => d !== s.answerKey[card.cardId])!;
    const before = s.score;
    s = rushReducer(s, { type: "route", destination: wrong });
    expect(s.streak).toBe(0);
    expect(s.score).toBe(before);
    expect(s.feedback?.kind).toBe("wrong");
    expect(s.feedback?.message.length).toBeGreaterThan(5);
  });

  it("tap-to-select routes the selected card, not the oldest", () => {
    let s = run(initRush(rushContent, D, 5), 3000);
    expect(s.active.length).toBeGreaterThanOrEqual(2);
    const second = s.active[1]!;
    s = rushReducer(s, { type: "select", uid: second.uid });
    expect(s.selectedUid).toBe(second.uid);
    s = rushReducer(s, { type: "route", destination: answerFor(s, second.uid) });
    expect(s.active.some((c) => c.uid === second.uid)).toBe(false);
    expect(s.outcomes.at(-1)?.cardId).toBe(second.cardId);
  });

  it("expires cards that run out of patience", () => {
    const s = run(initRush(rushContent, D, 9), RUSH_TUNING.patienceStartMs + 200);
    expect(s.outcomes.some((o) => o.result === "expired")).toBe(true);
    expect(s.streak).toBe(0);
  });

  it("ends at the duration and summarises", () => {
    let s = initRush(rushContent, D, 11);
    // Perfect player: route every card as soon as it appears.
    for (let t = 0; t < D + 500; t += 50) {
      s = rushReducer(s, { type: "tick", dtMs: 50 });
      while (s.status === "playing" && s.active.length > 0) s = rushReducer(s, { type: "route", destination: answerFor(s) });
    }
    expect(s.status).toBe("done");
    expect(s.elapsedMs).toBe(D);
    const r = summarizeRush(s);
    expect(r.success).toBe(true);
    expect(r.stats.wrong).toBe(0);
    expect(r.bestStreak).toBe(r.stats.correct);
    // Same inputs, same score.
    let s2 = initRush(rushContent, D, 11);
    for (let t = 0; t < D + 500; t += 50) {
      s2 = rushReducer(s2, { type: "tick", dtMs: 50 });
      while (s2.status === "playing" && s2.active.length > 0) s2 = rushReducer(s2, { type: "route", destination: answerFor(s2) });
    }
    expect(s2.score).toBe(s.score);
  });

  it("clamps huge ticks (e.g. a backgrounded tab)", () => {
    const s = rushReducer(rushReducer(initRush(rushContent, D, 1), { type: "tick", dtMs: 16 }), { type: "tick", dtMs: 60_000 });
    expect(s.elapsedMs).toBeLessThanOrEqual(16 + RUSH_TUNING.maxTickMs);
  });

  it("ignores input after the mission ends", () => {
    const done = run(initRush(rushContent, D, 2), D + 100);
    expect(rushReducer(done, { type: "route", destination: "api" })).toBe(done);
  });
});

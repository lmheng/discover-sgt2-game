import { describe, expect, it } from "vitest";
import { detectiveContent, events, getEventConfig, launchContent, researchContent, rushContent } from "@/config";

describe("content validation", () => {
  it("every Rush card has a known destination and an explanation", () => {
    const ids = new Set(rushContent.destinations.map((d) => d.id));
    for (const c of rushContent.cards) {
      expect(ids.has(c.answer)).toBe(true);
      expect(c.why.length).toBeGreaterThan(10);
    }
    // Balanced enough that always picking one dock never wins.
    for (const d of ids) expect(rushContent.cards.filter((c) => c.answer === d).length).toBeGreaterThanOrEqual(4);
  });

  it("each Detective round has exactly one odd term and at least two exact glossary matches", () => {
    for (const r of detectiveContent.rounds) {
      const terms = r.target.filter((s): s is { term: string; odd?: boolean } => "term" in s);
      const odd = terms.filter((t) => t.odd);
      expect(odd, r.id).toHaveLength(1);
      expect(odd[0]!.term).not.toBe(r.glossary.target);
      const matches = terms.filter((t) => !t.odd);
      expect(matches.length, r.id).toBeGreaterThanOrEqual(2);
      for (const m of matches) expect(m.term).toBe(r.glossary.target);
      expect(r.target.length).toBeGreaterThanOrEqual(6); // enough tap targets that guessing is unlikely
    }
  });

  it("non-English sample content carries a review status", () => {
    for (const r of detectiveContent.rounds) {
      expect(["illustrative-pending-review", "reviewed-approved"]).toContain(r.reviewStatus);
    }
    expect(launchContent.reviewStatus).toBeDefined();
  });

  it("research questions include neutral opt-outs", () => {
    const q = researchContent.questions;
    expect(q.workFunction.options.some((o) => o.id === "prefer_not_to_say")).toBe(true);
    expect(q.challenges.options.some((o) => o.id === "none" && o.exclusive)).toBe(true);
    expect(q.tools.options.some((o) => o.id === "none" && o.exclusive)).toBe(true);
    expect(q.capability.options.map((o) => o.id)).toEqual(expect.arrayContaining(["none", "unsure"]));
    expect(q.frequency.options.map((o) => o.id)).toEqual(["daily", "weekly", "monthly", "rarely", "never"]);
  });

  it("event configs load and the default event is {discover} 2026", () => {
    expect(events.length).toBeGreaterThanOrEqual(2);
    const e = getEventConfig("");
    expect(e.id).toBe("discover-2026");
    expect(e.date).toBe("2026-11-27");
    const total = e.missions.rush.durationMs + e.missions.detective.durationMs + e.missions.launch.durationMs;
    expect(total).toBeLessThanOrEqual(100_000);
    expect(() => getEventConfig("nope")).toThrow();
  });
});

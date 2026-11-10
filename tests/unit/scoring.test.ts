import { describe, expect, it } from "vitest";
import {
  SCORING,
  comboMultiplier,
  detectiveSolvePoints,
  rushHitPoints,
  rushSpeedBonus,
  tierFor,
  timeBonus,
} from "@/lib/game/scoring";

describe("comboMultiplier", () => {
  it.each([
    [0, 1], [1, 1], [2, 1], [3, 2], [5, 2], [6, 3], [9, 3], [10, 4], [99, 4], [-3, 1],
  ])("streak %i -> x%i", (streak, mult) => {
    expect(comboMultiplier(streak)).toBe(mult);
  });
});

describe("rushSpeedBonus", () => {
  it("uses integer thirds of patience", () => {
    expect(rushSpeedBonus(6000, 9000)).toBe(SCORING.rushSpeedBonusMid); // exactly 2/3 is not > 2/3
    expect(rushSpeedBonus(6001, 9000)).toBe(SCORING.rushSpeedBonusHigh);
    expect(rushSpeedBonus(3001, 9000)).toBe(SCORING.rushSpeedBonusMid);
    expect(rushSpeedBonus(3000, 9000)).toBe(0);
    expect(rushSpeedBonus(0, 9000)).toBe(0);
    expect(rushSpeedBonus(100, 0)).toBe(0);
  });
});

describe("points", () => {
  it("rush combines multiplier and speed bonus", () => {
    expect(rushHitPoints(1, 9000, 9000)).toBe(150);
    expect(rushHitPoints(3, 9000, 9000)).toBe(250);
    expect(rushHitPoints(10, 0, 9000)).toBe(400);
  });
  it("detective rewards fast solves", () => {
    expect(detectiveSolvePoints(1, 1000)).toBe(450);
    expect(detectiveSolvePoints(1, 5000)).toBe(375);
    expect(detectiveSolvePoints(1, 9000)).toBe(300);
    expect(detectiveSolvePoints(3, 1000)).toBe(900);
  });
  it("time bonus counts whole seconds", () => {
    expect(timeBonus(12_999)).toBe(120);
    expect(timeBonus(-5)).toBe(0);
  });
  it("every score is an integer", () => {
    for (let s = 0; s < 15; s++) {
      for (let p = 0; p <= 9000; p += 333) {
        expect(Number.isInteger(rushHitPoints(s, p, 9000))).toBe(true);
        expect(Number.isInteger(detectiveSolvePoints(s, p))).toBe(true);
      }
    }
  });
  it("tiers", () => {
    expect(tierFor(0)).toBe("rookie");
    expect(tierFor(2499)).toBe("rookie");
    expect(tierFor(2500)).toBe("specialist");
    expect(tierFor(4999)).toBe("specialist");
    expect(tierFor(5000)).toBe("master");
  });
});

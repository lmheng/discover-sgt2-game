/**
 * Deterministic, integer-only scoring rules shared by all missions.
 * Every function here is pure and covered by unit tests.
 */

export const SCORING = {
  rushBase: 100,
  rushSpeedBonusHigh: 50,
  rushSpeedBonusMid: 25,
  detectiveBase: 300,
  detectiveFastBonus: 150,
  detectiveQuickBonus: 75,
  detectiveFastMs: 4_000,
  detectiveQuickMs: 8_000,
  launchTranslated: 50,
  launchApproved: 100,
  launchGlossaryFix: 100,
  launchPublished: 250,
  launchAllPublishedBonus: 300,
  timeBonusPerSecond: 10,
} as const;

/** Streak thresholds (inclusive) to multiplier, highest first. */
export const COMBO_TIERS: readonly { minStreak: number; multiplier: 1 | 2 | 3 | 4 }[] = [
  { minStreak: 10, multiplier: 4 },
  { minStreak: 6, multiplier: 3 },
  { minStreak: 3, multiplier: 2 },
  { minStreak: 0, multiplier: 1 },
];

/**
 * Multiplier for a success that brings the streak to `streak`
 * (1 = first success after a miss).
 */
export function comboMultiplier(streak: number): 1 | 2 | 3 | 4 {
  const s = Math.max(0, Math.floor(streak));
  for (const tier of COMBO_TIERS) {
    if (s >= tier.minStreak) return tier.multiplier;
  }
  return 1;
}

/** Speed bonus from remaining patience, compared in integer arithmetic (no floats). */
export function rushSpeedBonus(patienceRemainingMs: number, patienceTotalMs: number): number {
  if (patienceTotalMs <= 0) return 0;
  const remaining = Math.max(0, Math.floor(patienceRemainingMs));
  // remaining / total > 2/3  <=>  3 * remaining > 2 * total
  if (3 * remaining > 2 * patienceTotalMs) return SCORING.rushSpeedBonusHigh;
  if (3 * remaining > patienceTotalMs) return SCORING.rushSpeedBonusMid;
  return 0;
}

export function rushHitPoints(streak: number, patienceRemainingMs: number, patienceTotalMs: number): number {
  return SCORING.rushBase * comboMultiplier(streak) + rushSpeedBonus(patienceRemainingMs, patienceTotalMs);
}

export function detectiveSolvePoints(streak: number, msInRound: number): number {
  const ms = Math.max(0, Math.floor(msInRound));
  const bonus =
    ms < SCORING.detectiveFastMs
      ? SCORING.detectiveFastBonus
      : ms < SCORING.detectiveQuickMs
        ? SCORING.detectiveQuickBonus
        : 0;
  return (SCORING.detectiveBase + bonus) * comboMultiplier(streak);
}

export function launchPublishPoints(streak: number): number {
  return SCORING.launchPublished * comboMultiplier(streak);
}

/** Bonus for finishing early: whole seconds remaining × rate. */
export function timeBonus(remainingMs: number): number {
  return Math.floor(Math.max(0, remainingMs) / 1000) * SCORING.timeBonusPerSecond;
}

export type ScoreTier = "rookie" | "specialist" | "master";

export const TIER_THRESHOLDS = { specialist: 2_500, master: 5_000 } as const;

export function tierFor(totalScore: number): ScoreTier {
  if (totalScore >= TIER_THRESHOLDS.master) return "master";
  if (totalScore >= TIER_THRESHOLDS.specialist) return "specialist";
  return "rookie";
}

export const TIER_LABELS: Record<ScoreTier, string> = {
  rookie: "Rookie Rescuer",
  specialist: "Rescue Specialist",
  master: "Master Rescuer",
};

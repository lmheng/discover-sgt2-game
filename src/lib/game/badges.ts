import { TIER_LABELS, tierFor, type ScoreTier } from "./scoring";
import type { MissionId, MissionResult } from "./types";

export interface Badge {
  id: string;
  title: string;
  description: string;
  mission: MissionId | null;
}

export interface RunSummary {
  totalScore: number;
  tier: ScoreTier;
  tierLabel: string;
  badges: Badge[];
  bestStreak: number;
  missionsSucceeded: number;
}

export function earnedBadges(results: readonly MissionResult[]): Badge[] {
  const badges: Badge[] = [];
  for (const r of results) {
    if (r.mission === "rush" && r.success) {
      badges.push({
        id: "routing-ranger",
        mission: "rush",
        title: "Routing Ranger",
        description: "Matched requests to the right SGT 2.0 tool.",
      });
    }
    if (r.mission === "detective" && r.success) {
      badges.push({
        id: "term-sleuth",
        mission: "detective",
        title: "Term Sleuth",
        description: "Spotted inconsistent terminology.",
      });
    }
    if (r.mission === "launch" && r.success) {
      badges.push({
        id: "launch-lead",
        mission: "launch",
        title: "Launch Lead",
        description: "Shipped a multilingual announcement on time.",
      });
      if ((r.stats.unreviewedPublishAttempts ?? 0) === 0) {
        badges.push({
          id: "review-champion",
          mission: "launch",
          title: "Review Champion",
          description: "Every translation was reviewed before publishing.",
        });
      }
    }
  }
  return badges;
}

export function summarizeRun(results: readonly MissionResult[]): RunSummary {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const tier = tierFor(totalScore);
  return {
    totalScore,
    tier,
    tierLabel: TIER_LABELS[tier],
    badges: earnedBadges(results),
    bestStreak: results.reduce((m, r) => Math.max(m, r.bestStreak), 0),
    missionsSucceeded: results.filter((r) => r.success).length,
  };
}

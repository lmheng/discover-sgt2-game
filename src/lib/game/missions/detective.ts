import type { DetectiveContent, DetectiveRound } from "@/config/schema";
import { seededShuffle } from "../rng";
import { detectiveSolvePoints, timeBonus } from "../scoring";
import type { Feedback, MissionResult } from "../types";

/**
 * Mission 2 - Terminology Detective.
 * Each round shows a fictional announcement with an approved glossary term.
 * One occurrence of that term in the translated panel differs from the
 * glossary. The player finds it by visual matching, so no knowledge of the
 * target language is needed.
 */

export const DETECTIVE_TUNING = {
  roundsPerMission: 3,
  hintAfterMs: 8_000,
  hintAfterWrongTaps: 2,
  wrongTapPenaltyMs: 2_000,
  revealMs: 2_200,
  successMinSolved: 2,
  maxTickMs: 100,
} as const;

export interface DetectiveSolve {
  roundId: string;
  msInRound: number;
  points: number;
  wrongTaps: number;
}

export interface DetectiveState {
  status: "playing" | "done";
  elapsedMs: number;
  durationMs: number;
  roundIds: string[];
  oddIndex: Record<string, number>;
  roundIndex: number;
  roundElapsedMs: number;
  wrongTapsThisRound: number;
  wrongTapIndices: number[];
  /** While revealing, the clock is paused and the solved token is shown. */
  revealing: { untilMs: number; segmentIndex: number } | null;
  revealElapsedMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  totalWrong: number;
  solves: DetectiveSolve[];
  timeBonusAwarded: number;
  feedback: Feedback | null;
  feedbackSeq: number;
}

export type DetectiveAction =
  | { type: "tick"; dtMs: number }
  | { type: "tap"; segmentIndex: number }
  | { type: "continue" };

export function findOddIndex(round: DetectiveRound): number {
  return round.target.findIndex((seg) => "term" in seg && seg.odd === true);
}

export function initDetective(content: DetectiveContent, durationMs: number, seed: number): DetectiveState {
  const chosen = seededShuffle(content.rounds, seed).slice(0, DETECTIVE_TUNING.roundsPerMission);
  const oddIndex: Record<string, number> = {};
  for (const r of chosen) oddIndex[r.id] = findOddIndex(r);
  return {
    status: "playing",
    elapsedMs: 0,
    durationMs,
    roundIds: chosen.map((r) => r.id),
    oddIndex,
    roundIndex: 0,
    roundElapsedMs: 0,
    wrongTapsThisRound: 0,
    wrongTapIndices: [],
    revealing: null,
    revealElapsedMs: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalWrong: 0,
    solves: [],
    timeBonusAwarded: 0,
    feedback: null,
    feedbackSeq: 0,
  };
}

export function currentRoundId(s: DetectiveState): string | undefined {
  return s.roundIds[s.roundIndex];
}

export function hintVisible(s: DetectiveState): boolean {
  return (
    s.roundElapsedMs >= DETECTIVE_TUNING.hintAfterMs || s.wrongTapsThisRound >= DETECTIVE_TUNING.hintAfterWrongTaps
  );
}

function feedback(s: DetectiveState, kind: Feedback["kind"], points: number, message: string): DetectiveState {
  const seq = s.feedbackSeq + 1;
  return { ...s, feedbackSeq: seq, feedback: { seq, kind, points, message } };
}

function advanceRound(s: DetectiveState): DetectiveState {
  const roundIndex = s.roundIndex + 1;
  const base = {
    ...s,
    revealing: null,
    revealElapsedMs: 0,
    roundIndex,
    roundElapsedMs: 0,
    wrongTapsThisRound: 0,
    wrongTapIndices: [],
  };
  if (roundIndex >= s.roundIds.length) {
    const bonus = timeBonus(s.durationMs - s.elapsedMs);
    return { ...base, status: "done", score: s.score + bonus, timeBonusAwarded: bonus };
  }
  return base;
}

function tick(s: DetectiveState, rawDt: number): DetectiveState {
  if (s.status !== "playing") return s;
  const dt = Math.min(Math.max(0, Math.floor(rawDt)), DETECTIVE_TUNING.maxTickMs);
  if (s.revealing) {
    const revealElapsedMs = s.revealElapsedMs + dt;
    if (revealElapsedMs >= s.revealing.untilMs) return advanceRound(s);
    return { ...s, revealElapsedMs };
  }
  const elapsedMs = Math.min(s.elapsedMs + dt, s.durationMs);
  const next = { ...s, elapsedMs, roundElapsedMs: s.roundElapsedMs + dt };
  if (elapsedMs >= s.durationMs) return { ...next, status: "done" };
  return next;
}

function tap(s: DetectiveState, segmentIndex: number): DetectiveState {
  if (s.status !== "playing" || s.revealing) return s;
  const roundId = currentRoundId(s);
  if (roundId === undefined) return s;
  const odd = s.oddIndex[roundId];
  if (segmentIndex === odd) {
    const streak = s.streak + 1;
    const points = detectiveSolvePoints(streak, s.roundElapsedMs);
    return feedback(
      {
        ...s,
        score: s.score + points,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        solves: [
          ...s.solves,
          { roundId, msInRound: s.roundElapsedMs, points, wrongTaps: s.wrongTapsThisRound },
        ],
        revealing: { untilMs: DETECTIVE_TUNING.revealMs, segmentIndex },
        revealElapsedMs: 0,
      },
      "correct",
      points,
      "Inconsistency found!",
    );
  }
  if (s.wrongTapIndices.includes(segmentIndex)) return s;
  // Wrong taps cost a little time, never points.
  const elapsedMs = Math.min(s.elapsedMs + DETECTIVE_TUNING.wrongTapPenaltyMs, s.durationMs);
  const next = feedback(
    {
      ...s,
      elapsedMs,
      streak: 0,
      wrongTapsThisRound: s.wrongTapsThisRound + 1,
      wrongTapIndices: [...s.wrongTapIndices, segmentIndex],
      totalWrong: s.totalWrong + 1,
    },
    "wrong",
    0,
    "That part matches. Compare it with the glossary term.",
  );
  return elapsedMs >= s.durationMs ? { ...next, status: "done" } : next;
}

export function detectiveReducer(state: DetectiveState, action: DetectiveAction): DetectiveState {
  switch (action.type) {
    case "tick":
      return tick(state, action.dtMs);
    case "tap":
      return tap(state, action.segmentIndex);
    case "continue":
      return state.revealing ? advanceRound(state) : state;
    default:
      return state;
  }
}

export function summarizeDetective(s: DetectiveState): MissionResult {
  return {
    mission: "detective",
    score: s.score,
    success: s.solves.length >= DETECTIVE_TUNING.successMinSolved,
    durationMs: s.elapsedMs,
    bestStreak: s.bestStreak,
    stats: {
      solved: s.solves.length,
      rounds: s.roundIds.length,
      wrongTaps: s.totalWrong,
      timeBonus: s.timeBonusAwarded,
    },
  };
}

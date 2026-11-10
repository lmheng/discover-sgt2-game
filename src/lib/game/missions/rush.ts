import type { DestinationId, RushContent } from "@/config/schema";
import { seededShuffle } from "../rng";
import { rushHitPoints } from "../scoring";
import type { Feedback, MissionResult } from "../types";

/**
 * Mission 1 - Translation Rush.
 * Request cards arrive over time; the player routes each to SG Translate
 * Together, Polyglot or the SGT 2.0 API before its patience runs out.
 */

export const RUSH_TUNING = {
  maxActive: 3,
  spawnIntervalStartMs: 2_400,
  spawnIntervalEndMs: 1_300,
  patienceStartMs: 7_500,
  patienceEndMs: 5_000,
  successMinCorrect: 6,
  maxTickMs: 100,
} as const;

export interface RushActiveCard {
  uid: number;
  cardId: string;
  spawnedAtMs: number;
  patienceMs: number;
}

export interface RushOutcome {
  cardId: string;
  result: "correct" | "wrong" | "expired";
  chosen: DestinationId | null;
  points: number;
  atMs: number;
}

export interface RushState {
  status: "playing" | "done";
  elapsedMs: number;
  durationMs: number;
  answerKey: Record<string, DestinationId>;
  whyKey: Record<string, string>;
  deck: string[];
  deckIndex: number;
  nextSpawnAtMs: number;
  nextUid: number;
  active: RushActiveCard[];
  selectedUid: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  outcomes: RushOutcome[];
  feedback: Feedback | null;
  feedbackSeq: number;
}

export type RushAction =
  | { type: "tick"; dtMs: number }
  | { type: "select"; uid: number | null }
  | { type: "route"; destination: DestinationId; uid?: number };

/** Linear interpolation using integers only. */
function lerpInt(start: number, end: number, num: number, den: number): number {
  if (den <= 0) return end;
  const n = Math.min(Math.max(num, 0), den);
  return start + Math.trunc(((end - start) * n) / den);
}

export function spawnIntervalAt(elapsedMs: number, durationMs: number): number {
  return lerpInt(RUSH_TUNING.spawnIntervalStartMs, RUSH_TUNING.spawnIntervalEndMs, elapsedMs, durationMs);
}

export function patienceAt(elapsedMs: number, durationMs: number): number {
  return lerpInt(RUSH_TUNING.patienceStartMs, RUSH_TUNING.patienceEndMs, elapsedMs, durationMs);
}

export function initRush(content: RushContent, durationMs: number, seed: number): RushState {
  const answerKey: Record<string, DestinationId> = {};
  const whyKey: Record<string, string> = {};
  for (const c of content.cards) {
    answerKey[c.id] = c.answer;
    whyKey[c.id] = c.why;
  }
  return {
    status: "playing",
    elapsedMs: 0,
    durationMs,
    answerKey,
    whyKey,
    deck: seededShuffle(
      content.cards.map((c) => c.id),
      seed,
    ),
    deckIndex: 0,
    nextSpawnAtMs: 0,
    nextUid: 1,
    active: [],
    selectedUid: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    outcomes: [],
    feedback: null,
    feedbackSeq: 0,
  };
}

export function remainingPatience(card: RushActiveCard, elapsedMs: number): number {
  return Math.max(0, card.patienceMs - (elapsedMs - card.spawnedAtMs));
}

function withFeedback(s: RushState, kind: Feedback["kind"], points: number, message: string): RushState {
  const seq = s.feedbackSeq + 1;
  return { ...s, feedbackSeq: seq, feedback: { seq, kind, points, message } };
}

function tick(s: RushState, rawDt: number): RushState {
  if (s.status !== "playing") return s;
  const dt = Math.min(Math.max(0, Math.floor(rawDt)), RUSH_TUNING.maxTickMs);
  const elapsedMs = Math.min(s.elapsedMs + dt, s.durationMs);
  let next: RushState = { ...s, elapsedMs };

  // Expire cards whose patience ran out.
  const expired = next.active.filter((c) => remainingPatience(c, elapsedMs) <= 0);
  if (expired.length > 0) {
    const outcomes = [...next.outcomes];
    for (const c of expired) {
      outcomes.push({ cardId: c.cardId, result: "expired", chosen: null, points: 0, atMs: elapsedMs });
    }
    const active = next.active.filter((c) => !expired.includes(c));
    const selectedUid = active.some((c) => c.uid === next.selectedUid) ? next.selectedUid : null;
    next = withFeedback(
      { ...next, active, outcomes, streak: 0, selectedUid },
      "expired",
      0,
      "A request timed out. Combo reset.",
    );
  }

  // Spawn new cards.
  if (elapsedMs >= next.nextSpawnAtMs && next.active.length < RUSH_TUNING.maxActive && elapsedMs < next.durationMs) {
    const cardId = next.deck[next.deckIndex % next.deck.length] as string;
    const card: RushActiveCard = {
      uid: next.nextUid,
      cardId,
      spawnedAtMs: elapsedMs,
      patienceMs: patienceAt(elapsedMs, next.durationMs),
    };
    next = {
      ...next,
      active: [...next.active, card],
      deckIndex: next.deckIndex + 1,
      nextUid: next.nextUid + 1,
      nextSpawnAtMs: elapsedMs + spawnIntervalAt(elapsedMs, next.durationMs),
    };
  }

  if (elapsedMs >= next.durationMs) {
    next = { ...next, status: "done", active: [], selectedUid: null };
  }
  return next;
}

function route(s: RushState, destination: DestinationId, uid: number | undefined): RushState {
  if (s.status !== "playing" || s.active.length === 0) return s;
  const targetUid = uid ?? s.selectedUid ?? s.active[0]?.uid;
  const card = s.active.find((c) => c.uid === targetUid);
  if (!card) return s;

  const active = s.active.filter((c) => c.uid !== card.uid);
  const correct = s.answerKey[card.cardId] === destination;
  if (correct) {
    const streak = s.streak + 1;
    const points = rushHitPoints(streak, remainingPatience(card, s.elapsedMs), card.patienceMs);
    return withFeedback(
      {
        ...s,
        active,
        selectedUid: null,
        score: s.score + points,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        outcomes: [
          ...s.outcomes,
          { cardId: card.cardId, result: "correct", chosen: destination, points, atMs: s.elapsedMs },
        ],
      },
      "correct",
      points,
      "Routed!",
    );
  }
  return withFeedback(
    {
      ...s,
      active,
      selectedUid: null,
      streak: 0,
      outcomes: [...s.outcomes, { cardId: card.cardId, result: "wrong", chosen: destination, points: 0, atMs: s.elapsedMs }],
    },
    "wrong",
    0,
    s.whyKey[card.cardId] ?? "That one belongs elsewhere.",
  );
}

export function rushReducer(state: RushState, action: RushAction): RushState {
  switch (action.type) {
    case "tick":
      return tick(state, action.dtMs);
    case "select":
      if (state.status !== "playing") return state;
      if (action.uid !== null && !state.active.some((c) => c.uid === action.uid)) return state;
      return { ...state, selectedUid: action.uid === state.selectedUid ? null : action.uid };
    case "route":
      return route(state, action.destination, action.uid);
    default:
      return state;
  }
}

export function summarizeRush(s: RushState): MissionResult {
  const count = (r: RushOutcome["result"]) => s.outcomes.filter((o) => o.result === r).length;
  const correct = count("correct");
  return {
    mission: "rush",
    score: s.score,
    success: correct >= RUSH_TUNING.successMinCorrect,
    durationMs: s.elapsedMs,
    bestStreak: s.bestStreak,
    stats: { correct, wrong: count("wrong"), expired: count("expired") },
  };
}

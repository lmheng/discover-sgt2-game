import type { LanguageId, LaunchContent } from "@/config/schema";
import { mulberry32 } from "../rng";
import { SCORING, launchPublishPoints, timeBonus } from "../scoring";
import type { Feedback, MissionResult } from "../types";

/**
 * Mission 3 - Save the Launch.
 * Each language lane moves Draft → Run SGT → Translated → Human review →
 * (glossary fix if flagged) → Approved → Published. Reviewers are a shared,
 * limited resource. Publishing an unreviewed lane is blocked with a time
 * penalty, which teaches that AI translations may need human review before
 * publication.
 */

export type LaneStage = "draft" | "translating" | "translated" | "reviewing" | "issue" | "approved" | "published";

export interface LaneState {
  id: LanguageId;
  stage: LaneStage;
  progressMs: number;
  reviewerId: string | null;
  flagged: boolean;
}

export interface ReviewerState {
  id: string;
  laneId: LanguageId | null;
}

export interface LaunchState {
  status: "playing" | "done";
  elapsedMs: number;
  durationMs: number;
  translateMs: number;
  reviewMs: number;
  penaltyMs: number;
  lanes: LaneState[];
  reviewers: ReviewerState[];
  selectedReviewerId: string | null;
  score: number;
  streak: number;
  bestStreak: number;
  unreviewedPublishAttempts: number;
  fixesApplied: number;
  completionBonus: number;
  feedback: Feedback | null;
  feedbackSeq: number;
}

export type LaunchAction =
  | { type: "tick"; dtMs: number }
  | { type: "runSgt"; laneId: LanguageId }
  | { type: "selectReviewer"; reviewerId: string | null }
  | { type: "assignReviewer"; laneId: LanguageId; reviewerId?: string }
  | { type: "fixIssue"; laneId: LanguageId }
  | { type: "publish"; laneId: LanguageId };

const MAX_TICK_MS = 100;

export function initLaunch(content: LaunchContent, durationMs: number, seed: number): LaunchState {
  const rand = mulberry32(seed);
  const flaggedIndex = Math.floor(rand() * content.lanes.length);
  return {
    status: "playing",
    elapsedMs: 0,
    durationMs,
    translateMs: content.timings.translateMs,
    reviewMs: content.timings.reviewMs,
    penaltyMs: content.timings.unreviewedPenaltyMs,
    lanes: content.lanes.map((l, i) => ({
      id: l.id,
      stage: "draft",
      progressMs: 0,
      reviewerId: null,
      flagged: i === flaggedIndex,
    })),
    reviewers: content.reviewers.map((r) => ({ id: r.id, laneId: null })),
    selectedReviewerId: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    unreviewedPublishAttempts: 0,
    fixesApplied: 0,
    completionBonus: 0,
    feedback: null,
    feedbackSeq: 0,
  };
}

function fb(s: LaunchState, kind: Feedback["kind"], points: number, message: string): LaunchState {
  const seq = s.feedbackSeq + 1;
  return { ...s, feedbackSeq: seq, feedback: { seq, kind, points, message } };
}

function updateLane(s: LaunchState, id: LanguageId, patch: Partial<LaneState>): LaneState[] {
  return s.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l));
}

function freeReviewer(reviewers: ReviewerState[], reviewerId: string | null): ReviewerState[] {
  return reviewers.map((r) => (r.id === reviewerId ? { ...r, laneId: null } : r));
}

function tick(s: LaunchState, rawDt: number): LaunchState {
  if (s.status !== "playing") return s;
  const dt = Math.min(Math.max(0, Math.floor(rawDt)), MAX_TICK_MS);
  const elapsedMs = Math.min(s.elapsedMs + dt, s.durationMs);
  let next: LaunchState = { ...s, elapsedMs };
  let reviewers = next.reviewers;
  let gained = 0;
  const events: { kind: Feedback["kind"]; message: string }[] = [];

  const lanes = next.lanes.map((lane) => {
    if (lane.stage === "translating") {
      const progressMs = lane.progressMs + dt;
      if (progressMs >= next.translateMs) {
        gained += SCORING.launchTranslated;
        events.push({ kind: "info", message: "AI draft ready. Needs human review." });
        return { ...lane, stage: "translated" as const, progressMs: 0 };
      }
      return { ...lane, progressMs };
    }
    if (lane.stage === "reviewing") {
      const progressMs = lane.progressMs + dt;
      if (progressMs >= next.reviewMs) {
        reviewers = freeReviewer(reviewers, lane.reviewerId);
        if (lane.flagged) {
          events.push({ kind: "warning", message: "Reviewer flagged a term issue. Apply the glossary fix." });
          return { ...lane, stage: "issue" as const, progressMs: 0, reviewerId: null };
        }
        gained += SCORING.launchApproved;
        events.push({ kind: "correct", message: "Review passed. Ready to publish." });
        return { ...lane, stage: "approved" as const, progressMs: 0, reviewerId: null };
      }
      return { ...lane, progressMs };
    }
    return lane;
  });

  next = { ...next, lanes, reviewers, score: next.score + gained };
  const last = events[events.length - 1];
  if (last) next = fb(next, last.kind, gained, last.message);

  if (elapsedMs >= next.durationMs) next = { ...next, status: "done" };
  return next;
}

function runSgt(s: LaunchState, laneId: LanguageId): LaunchState {
  const lane = s.lanes.find((l) => l.id === laneId);
  if (s.status !== "playing" || !lane || lane.stage !== "draft") return s;
  return { ...s, lanes: updateLane(s, laneId, { stage: "translating", progressMs: 0 }) };
}

function assignReviewer(s: LaunchState, laneId: LanguageId, reviewerId?: string): LaunchState {
  if (s.status !== "playing") return s;
  const lane = s.lanes.find((l) => l.id === laneId);
  if (!lane || lane.stage !== "translated") {
    if (lane && (lane.stage === "draft" || lane.stage === "translating")) {
      return fb(s, "info", 0, "Run SGT first. Reviewers need a draft to review.");
    }
    return s;
  }
  const wanted = reviewerId ?? s.selectedReviewerId;
  const reviewer =
    s.reviewers.find((r) => r.id === wanted && r.laneId === null) ?? s.reviewers.find((r) => r.laneId === null);
  if (!reviewer) return fb(s, "info", 0, "All reviewers are busy. Wait for one to finish.");
  return {
    ...s,
    selectedReviewerId: null,
    lanes: updateLane(s, laneId, { stage: "reviewing", progressMs: 0, reviewerId: reviewer.id }),
    reviewers: s.reviewers.map((r) => (r.id === reviewer.id ? { ...r, laneId } : r)),
  };
}

function fixIssue(s: LaunchState, laneId: LanguageId): LaunchState {
  const lane = s.lanes.find((l) => l.id === laneId);
  if (s.status !== "playing" || !lane || lane.stage !== "issue") return s;
  const streak = s.streak + 1;
  return fb(
    {
      ...s,
      lanes: updateLane(s, laneId, { stage: "approved", flagged: false }),
      score: s.score + SCORING.launchGlossaryFix,
      fixesApplied: s.fixesApplied + 1,
      streak,
      bestStreak: Math.max(s.bestStreak, streak),
    },
    "correct",
    SCORING.launchGlossaryFix,
    "Glossary fix applied. Approved!",
  );
}

function publish(s: LaunchState, laneId: LanguageId): LaunchState {
  const lane = s.lanes.find((l) => l.id === laneId);
  if (s.status !== "playing" || !lane) return s;
  if (lane.stage === "translated") {
    const elapsedMs = Math.min(s.elapsedMs + s.penaltyMs, s.durationMs);
    const next = fb(
      { ...s, elapsedMs, streak: 0, unreviewedPublishAttempts: s.unreviewedPublishAttempts + 1 },
      "warning",
      0,
      "Hold on! AI translations may need human review before publication.",
    );
    return elapsedMs >= s.durationMs ? { ...next, status: "done" } : next;
  }
  if (lane.stage !== "approved") return s;
  const streak = s.streak + 1;
  const points = launchPublishPoints(streak);
  let next: LaunchState = fb(
    {
      ...s,
      lanes: updateLane(s, laneId, { stage: "published" }),
      score: s.score + points,
      streak,
      bestStreak: Math.max(s.bestStreak, streak),
    },
    "correct",
    points,
    "Published!",
  );
  if (next.lanes.every((l) => l.stage === "published")) {
    const bonus = SCORING.launchAllPublishedBonus + timeBonus(next.durationMs - next.elapsedMs);
    next = { ...next, status: "done", score: next.score + bonus, completionBonus: bonus };
  }
  return next;
}

export function launchReducer(state: LaunchState, action: LaunchAction): LaunchState {
  switch (action.type) {
    case "tick":
      return tick(state, action.dtMs);
    case "runSgt":
      return runSgt(state, action.laneId);
    case "selectReviewer": {
      if (state.status !== "playing") return state;
      const r = state.reviewers.find((x) => x.id === action.reviewerId);
      if (action.reviewerId !== null && (!r || r.laneId !== null)) return state;
      return {
        ...state,
        selectedReviewerId: action.reviewerId === state.selectedReviewerId ? null : action.reviewerId,
      };
    }
    case "assignReviewer":
      return assignReviewer(state, action.laneId, action.reviewerId);
    case "fixIssue":
      return fixIssue(state, action.laneId);
    case "publish":
      return publish(state, action.laneId);
    default:
      return state;
  }
}

export function summarizeLaunch(s: LaunchState): MissionResult {
  const published = s.lanes.filter((l) => l.stage === "published").length;
  return {
    mission: "launch",
    score: s.score,
    success: published === s.lanes.length,
    durationMs: s.elapsedMs,
    bestStreak: s.bestStreak,
    stats: {
      published,
      lanes: s.lanes.length,
      unreviewedPublishAttempts: s.unreviewedPublishAttempts,
      fixesApplied: s.fixesApplied,
      completionBonus: s.completionBonus,
    },
  };
}

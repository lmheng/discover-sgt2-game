import type { MissionId, MissionResult } from "./types";

/**
 * Top-level run flow, as a pure state machine.
 *
 * attract → title → run steps (desk, missions and "Real Mission" interludes)
 * → results → (optional) interest → thanks → attract
 */

export type InterludeQuestion = "contentTypes" | "challenges" | "tools" | "capability";

export type RunStep =
  | { kind: "desk" }
  | { kind: "intro"; mission: MissionId }
  | { kind: "play"; mission: MissionId }
  | { kind: "missionResult"; mission: MissionId }
  | { kind: "interlude"; question: InterludeQuestion };

export type FlowState =
  | { phase: "attract" }
  | { phase: "title" }
  | { phase: "run"; plan: RunStep[]; index: number; attempt: number }
  | { phase: "results"; attempt: number }
  | { phase: "interest"; attempt: number }
  | { phase: "thanks"; attempt: number };

export interface PlanOptions {
  missions: readonly MissionId[];
  researchEnabled: boolean;
  /** Research steps already completed or skipped this visit are not asked again. */
  researchDone: ReadonlySet<"desk" | InterludeQuestion>;
}

const INTERLUDE_AFTER: Record<MissionId, InterludeQuestion> = {
  rush: "contentTypes",
  detective: "challenges",
  launch: "tools",
};

export function buildRunPlan(opts: PlanOptions): RunStep[] {
  const research = (q: "desk" | InterludeQuestion) => opts.researchEnabled && !opts.researchDone.has(q);
  const plan: RunStep[] = [];
  if (research("desk")) plan.push({ kind: "desk" });
  for (const mission of opts.missions) {
    plan.push({ kind: "intro", mission }, { kind: "play", mission }, { kind: "missionResult", mission });
    const q = INTERLUDE_AFTER[mission];
    if (research(q)) plan.push({ kind: "interlude", question: q });
  }
  if (research("capability")) plan.push({ kind: "interlude", question: "capability" });
  return plan;
}

export type FlowAction =
  | { type: "wake" }
  | { type: "begin"; plan: RunStep[] }
  | { type: "next"; skip?: (step: RunStep) => boolean }
  | { type: "replay"; plan: RunStep[] }
  | { type: "showInterest" }
  | { type: "finish" }
  | { type: "reset" };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "wake":
      return state.phase === "attract" ? { phase: "title" } : state;
    case "begin":
      if (state.phase !== "title") return state;
      return action.plan.length > 0 ? { phase: "run", plan: action.plan, index: 0, attempt: 1 } : { phase: "results", attempt: 1 };
    case "next": {
      if (state.phase !== "run") return state;
      let index = state.index + 1;
      while (index < state.plan.length && action.skip?.(state.plan[index] as RunStep)) index++;
      if (index >= state.plan.length) return { phase: "results", attempt: state.attempt };
      return { ...state, index };
    }
    case "replay": {
      if (state.phase !== "results" && state.phase !== "thanks" && state.phase !== "interest") return state;
      const attempt = state.attempt + 1;
      return action.plan.length > 0 ? { phase: "run", plan: action.plan, index: 0, attempt } : { phase: "results", attempt };
    }
    case "showInterest":
      return state.phase === "results" ? { phase: "interest", attempt: state.attempt } : state;
    case "finish":
      return state.phase === "results" || state.phase === "interest" ? { phase: "thanks", attempt: state.attempt } : state;
    case "reset":
      return { phase: "attract" };
    default:
      return state;
  }
}

export function currentStep(state: FlowState): RunStep | null {
  return state.phase === "run" ? (state.plan[state.index] ?? null) : null;
}

/** Fraction of missions completed for the progress indicator (0 to total). */
export function missionProgress(state: FlowState, results: readonly MissionResult[], total: number): number {
  if (state.phase === "attract" || state.phase === "title") return 0;
  return Math.min(results.length, total);
}

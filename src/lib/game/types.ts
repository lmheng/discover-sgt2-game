export const missionIds = ["rush", "detective", "launch"] as const;
export type MissionId = (typeof missionIds)[number];

export interface MissionResult {
  mission: MissionId;
  score: number;
  success: boolean;
  /** Mission time actually used, in ms (capped at the configured duration). */
  durationMs: number;
  bestStreak: number;
  /** Mission-specific integer counters (for result screens and analytics). */
  stats: Record<string, number>;
}

export type FeedbackKind = "correct" | "wrong" | "expired" | "info" | "warning";

export interface Feedback {
  /** Monotonic id so the UI can re-trigger animations for repeated feedback. */
  seq: number;
  kind: FeedbackKind;
  points: number;
  message: string;
}

export const MISSION_TITLES: Record<MissionId, string> = {
  rush: "Translation Rush",
  detective: "Terminology Detective",
  launch: "Save the Launch",
};

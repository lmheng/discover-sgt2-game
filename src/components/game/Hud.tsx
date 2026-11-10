"use client";

import { AnimatePresence, motion } from "motion/react";
import { comboMultiplier } from "@/lib/game/scoring";
import { MISSION_TITLES, missionIds, type Feedback, type MissionId } from "@/lib/game/types";
import { Icon } from "@/components/ui/Icon";
import { useAnimatedNumber } from "./hooks";

export function ProgressDots({ current, completed }: { current: MissionId | null; completed: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Mission progress: ${completed} of 3 complete`}>
      {missionIds.map((m, i) => {
        const done = i < completed;
        const active = m === current;
        return (
          <li
            key={m}
            title={MISSION_TITLES[m]}
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.65rem] font-bold ${
              done
                ? "border-blue-300 bg-blue-500 text-white"
                : active
                  ? "border-purple-400 bg-purple-500/30 text-ink"
                  : "border-white/25 text-muted"
            }`}
          >
            {done ? <Icon name="check" size={14} /> : i + 1}
            <span className="sr-only">
              {MISSION_TITLES[m]} {done ? "complete" : active ? "in progress" : "not started"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Timer({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000);
  const frac = totalMs > 0 ? Math.max(0, remainingMs) / totalMs : 0;
  const low = secs <= 5;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2" role="timer" aria-label={`${secs} seconds left`}>
      <Icon name="clock" size={20} className={low ? "text-red-400" : "text-blue-300"} />
      <div className="relative h-3 min-w-16 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${low ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-purple-500"}`}
          style={{ width: `${frac * 100}%`, transition: "width 120ms linear" }}
        />
      </div>
      <span className={`w-9 text-right font-mono text-lg font-bold tabular-nums ${low ? "text-red-400" : ""}`} aria-hidden>
        {secs}s
      </span>
    </div>
  );
}

export function ScoreCounter({ score, label = "Score" }: { score: number; label?: string }) {
  const shown = useAnimatedNumber(score);
  return (
    <div className="flex flex-col items-end leading-none" aria-live="off">
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted">{label}</span>
      <motion.span
        key={score}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="font-mono text-2xl font-extrabold tabular-nums"
        data-testid="score"
      >
        {shown.toLocaleString("en-SG")}
      </motion.span>
    </div>
  );
}

export function ComboBadge({ streak }: { streak: number }) {
  const mult = comboMultiplier(streak);
  return (
    <div className="flex h-10 min-w-14 items-center justify-center" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {mult > 1 ? (
          <motion.div
            key={mult}
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-1 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-500 to-blue-500 px-2.5 py-1 text-lg font-black text-white shadow-lg shadow-purple-900/50"
          >
            <Icon name="bolt" size={16} />x{mult}
            <span className="sr-only">combo multiplier</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Hud({
  mission,
  completed,
  remainingMs,
  totalMs,
  score,
  streak,
}: {
  mission: MissionId;
  completed: number;
  remainingMs: number;
  totalMs: number;
  score: number;
  streak: number;
}) {
  return (
    <header className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-2 sm:px-4">
      <div className="flex items-center gap-3">
        <ProgressDots current={mission} completed={completed} />
        <h2 className="hidden text-sm font-bold tracking-wide sm:block">{MISSION_TITLES[mission]}</h2>
      </div>
      <Timer remainingMs={remainingMs} totalMs={totalMs} />
      <div className="ml-auto flex items-center gap-3">
        <ComboBadge streak={streak} />
        <ScoreCounter score={score} />
      </div>
    </header>
  );
}

const feedbackStyle: Record<Feedback["kind"], { icon: "check" | "cross" | "alert" | "info" | "clock"; cls: string; label: string }> = {
  correct: { icon: "check", cls: "border-blue-300 bg-blue-600/90", label: "Correct" },
  wrong: { icon: "cross", cls: "border-dashed border-red-400 bg-navy-800/95", label: "Not quite" },
  expired: { icon: "clock", cls: "border-dashed border-red-400 bg-navy-800/95", label: "Timed out" },
  warning: { icon: "alert", cls: "border-red-400 bg-red-500/90", label: "Hold on" },
  info: { icon: "info", cls: "border-purple-300 bg-purple-600/90", label: "Tip" },
};

/** Live feedback banner: icon + label + text, never colour alone. */
export function FeedbackToast({ feedback }: { feedback: Feedback | null }) {
  return (
    <div className="pointer-events-none min-h-14" aria-live="assertive" aria-atomic="true">
      <AnimatePresence mode="popLayout">
        {feedback ? (
          <motion.div
            key={feedback.seq}
            initial={{ y: -10, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-white shadow-xl ${feedbackStyle[feedback.kind].cls}`}
            data-testid="feedback"
            data-kind={feedback.kind}
          >
            <Icon name={feedbackStyle[feedback.kind].icon} size={22} />
            <p className="text-sm font-medium sm:text-base">
              <span className="font-bold">{feedbackStyle[feedback.kind].label}. </span>
              {feedback.message}
            </p>
            {feedback.points > 0 ? (
              <span className="ml-auto animate-pop font-mono text-lg font-black">+{feedback.points}</span>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function poseForFeedback(f: Feedback | null): "idle" | "celebrate" | "oops" | "thinking" {
  if (!f) return "idle";
  if (f.kind === "correct") return "celebrate";
  if (f.kind === "wrong" || f.kind === "expired") return "oops";
  if (f.kind === "warning") return "oops";
  return "thinking";
}

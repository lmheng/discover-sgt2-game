"use client";

import { AnimatePresence, motion } from "motion/react";
import { comboMultiplier } from "@/lib/game/scoring";
import { MISSION_TITLES, missionIds, type Feedback, type MissionId } from "@/lib/game/types";
import { Icon } from "@/components/ui/Icon";
import { BlockBar, PixelProgress } from "@/components/ui/PixelProgress";
import { useAnimatedNumber } from "./hooks";

export function Timer({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000);
  const frac = totalMs > 0 ? Math.max(0, remainingMs) / totalMs : 0;
  const low = secs <= 5;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2" role="timer" aria-label={`${secs} seconds left`}>
      <Icon name="clock" size={20} className={low ? "text-witty-red-ink" : "text-ink"} />
      <BlockBar fraction={frac} blocks={16} tone={low ? "red" : "forest"} className="min-w-16 flex-1" />
      <span
        className={`w-10 text-right font-pixel text-lg tabular-nums ${low ? "animate-blink text-witty-red-ink" : "text-ink"}`}
        aria-hidden
      >
        {secs}s
      </span>
    </div>
  );
}

export function ScoreCounter({ score, label = "Score" }: { score: number; label?: string }) {
  const shown = useAnimatedNumber(score);
  return (
    <div className="checker flex flex-col items-end border-2 border-ink px-2 py-1 leading-none" aria-live="off">
      <span className="font-pixel text-[0.6rem] uppercase text-muted">{label}</span>
      <motion.span
        key={score}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="font-pixel text-xl tabular-nums text-ink sm:text-2xl"
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
            animate={{ scale: 1, rotate: -4, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-1 border-2 border-ink bg-butter px-2 py-1 font-pixel text-lg text-ink shadow-pixel-sm"
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
  const stageNo = missionIds.indexOf(mission) + 1;
  return (
    <header className="retro-surface flex flex-col">
      <div className="flex items-center gap-2 border-b-2 border-ink bg-butter px-2 py-1">
        <h2 className="flex min-w-0 items-center gap-1.5 font-pixel text-xs uppercase leading-none sm:text-sm">
          <span className="shrink-0">STAGE_0{stageNo}.EXE</span>
          <span className="hidden truncate text-muted sm:inline">· {MISSION_TITLES[mission]}</span>
        </h2>
        <PixelProgress completed={completed} compact blocks={9} className="ml-auto w-40 sm:w-60" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 py-2 sm:px-3">
        <Timer remainingMs={remainingMs} totalMs={totalMs} />
        <div className="ml-auto flex items-center gap-3">
          <ComboBadge streak={streak} />
          <ScoreCounter score={score} />
        </div>
      </div>
    </header>
  );
}

const feedbackStyle: Record<Feedback["kind"], { icon: "check" | "cross" | "alert" | "info" | "clock"; cls: string; label: string }> = {
  correct: { icon: "check", cls: "bg-mint text-ink", label: "Correct" },
  wrong: { icon: "cross", cls: "bg-coral text-ink", label: "Not quite" },
  expired: { icon: "clock", cls: "bg-coral text-ink", label: "Timed out" },
  warning: { icon: "alert", cls: "bg-butter text-ink", label: "Hold on" },
  info: { icon: "info", cls: "bg-paper text-ink", label: "Tip" },
};

/** Live feedback banner as a mini system dialog: icon + label + text, never colour alone. */
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
            className={`mx-auto flex max-w-xl items-stretch border-2 border-ink shadow-pixel ${feedbackStyle[feedback.kind].cls}`}
            data-testid="feedback"
            data-kind={feedback.kind}
          >
            <span className="flex items-center border-r-2 border-ink bg-paper px-2.5">
              <Icon name={feedbackStyle[feedback.kind].icon} size={22} strokeWidth={3} />
            </span>
            <p className="flex-1 px-3 py-2 text-sm font-medium sm:text-base">
              <span className="font-pixel font-bold uppercase">{feedbackStyle[feedback.kind].label}. </span>
              {feedback.message}
            </p>
            {feedback.points > 0 ? (
              <span className="flex items-center border-l-2 border-ink bg-paper px-2.5 font-pixel text-lg text-forest animate-pop">
                +{feedback.points}
              </span>
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

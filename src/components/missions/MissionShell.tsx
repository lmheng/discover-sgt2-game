"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Witty } from "@/components/mascot/Witty";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { FeedbackToast, Hud, poseForFeedback } from "@/components/game/Hud";
import { useTransient } from "@/components/game/hooks";
import { playSound } from "@/lib/sound";
import { comboMultiplier } from "@/lib/game/scoring";
import type { Feedback, MissionId } from "@/lib/game/types";

/** Shared layout for the three gameplay scenes. */
export function MissionShell({
  mission,
  completed,
  remainingMs,
  totalMs,
  score,
  streak,
  feedback,
  done,
  doneLabel = "Time!",
  children,
}: {
  doneLabel?: string;
  mission: MissionId;
  completed: number;
  remainingMs: number;
  totalMs: number;
  score: number;
  streak: number;
  feedback: Feedback | null;
  done: boolean;
  children: ReactNode;
}) {
  const visible = useTransient(feedback);
  const lastSeq = useRef(0);
  useEffect(() => {
    if (!feedback || feedback.seq === lastSeq.current) return;
    lastSeq.current = feedback.seq;
    if (feedback.kind === "correct") playSound(comboMultiplier(streak) > 1 ? "combo" : "correct");
    else if (feedback.kind === "warning") playSound("warning");
    else if (feedback.kind === "wrong" || feedback.kind === "expired") playSound("wrong");
  }, [feedback, streak]);

  return (
    <section className="relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3 px-3 pb-3 pt-3 sm:px-6" data-testid={`scene-${mission}`}>
      {/* Sticky so the timer, score and feedback stay visible when a scene scrolls on small screens. */}
      <div className="sticky top-0 z-20 -mx-3 flex flex-col gap-2 border-b-2 border-ink bg-cream/95 px-3 pb-2 pt-2 sm:-mx-6 sm:px-6">
        <Hud mission={mission} completed={completed} remainingMs={remainingMs} totalMs={totalMs} score={score} streak={streak} />
        <div className="flex items-center gap-3">
          <Witty pose={done ? "cheer" : poseForFeedback(visible)} reactionKey={visible?.seq} size={56} />
          <div className="flex-1">
            <FeedbackToast feedback={visible} />
          </div>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      {done ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center" aria-live="assertive">
          <RetroWindow title="SYSTEM.MSG" icon="alert" variant="coral" className="animate-pop w-72 max-w-[90%]" bodyClassName="px-6 py-5 text-center">
            <p className="font-pixel text-3xl font-bold uppercase text-ink">{doneLabel}</p>
          </RetroWindow>
        </div>
      ) : null}
    </section>
  );
}

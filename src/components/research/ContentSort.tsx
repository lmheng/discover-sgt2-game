"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { researchContent } from "@/config";
import { shuffleWithPinned } from "@/lib/game/rng";
import type { MultiAnswer } from "@/lib/research/schema";
import { Button, Kbd } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { clientPoint, dropTargetAt, useKeys } from "@/components/game/hooks";
import { InterludeFrame } from "./InterludeFrame";

/** Reuses the Translation Rush mechanic: fling each content type into "Mine" or "Not me". */
export function ContentSort({ seed, onDone }: { seed: number; onDone: (a: MultiAnswer) => void }) {
  const q = researchContent.questions.contentTypes;
  const deck = useMemo(() => shuffleWithPinned(q.options, seed + 1, (o) => !!o.pinned), [q.options, seed]);
  const [index, setIndex] = useState(0);
  const [mine, setMine] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const current = deck[index];
  const finished = index >= deck.length;

  const sort = (bin: "mine" | "notme") => {
    if (!current) return;
    if (bin === "mine") setMine((m) => [...m, current.id]);
    setIndex((i) => i + 1);
  };

  useKeys((e) => {
    if (e.key === "1" || e.key === "ArrowLeft") sort("mine");
    if (e.key === "2" || e.key === "ArrowRight") sort("notme");
  }, !finished);

  const done = () => onDone({ status: "answered", values: mine });

  return (
    <InterludeFrame
      testId="interlude-contentTypes"
      title="What lands on your real desk?"
      subtitle="Same moves as Translation Rush: send each card to “Mine” or “Not me”."
      onSkip={() => onDone({ status: "skipped" })}
      footer={
        <Button onClick={done} iconAfter="arrow" variant={finished ? "primary" : "secondary"} data-testid="interlude-done">
          {finished ? "Continue" : "Done sorting"}
        </Button>
      }
    >
      <p className="mb-3 text-center text-sm text-muted" aria-live="polite">
        {finished ? `Sorted! ${mine.length} on your desk.` : `Card ${index + 1} of ${deck.length}`}
      </p>
      <div className="flex min-h-40 items-center justify-center">
        <AnimatePresence mode="popLayout">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: -30, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.06, zIndex: 20 }}
              onDrag={(e) => {
                const p = clientPoint(e as PointerEvent);
                const t = p ? dropTargetAt(p.x, p.y) : null;
                if (t !== hover) setHover(t);
              }}
              onDragEnd={(e) => {
                setHover(null);
                const p = clientPoint(e as PointerEvent);
                const t = p ? dropTargetAt(p.x, p.y) : null;
                if (t === "mine" || t === "notme") sort(t);
              }}
              className="w-full max-w-sm cursor-grab touch-none rounded-2xl bg-white px-5 py-6 text-center text-xl font-bold text-navy-950 shadow-2xl active:cursor-grabbing"
              data-testid="content-card"
            >
              {current.label}
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 text-lg font-semibold text-blue-300">
              <Icon name="check" size={24} /> All sorted
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(
          [
            ["mine", "On my desk", "1", "check"],
            ["notme", "Not me", "2", "cross"],
          ] as const
        ).map(([id, label, key, icon]) => (
          <button
            key={id}
            type="button"
            data-drop={id}
            disabled={finished}
            onClick={() => sort(id)}
            className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-lg font-bold transition ${
              hover === id ? "scale-105 border-purple-300 bg-purple-500/30" : id === "mine" ? "border-white/25 bg-navy-700" : "border-dashed border-white/25 bg-navy-800"
            }`}
            data-testid={`sort-${id}`}
          >
            <Icon name={icon} size={24} />
            {label}
            <span className="hidden sm:block">
              <Kbd>{key}</Kbd>
            </span>
          </button>
        ))}
      </div>
    </InterludeFrame>
  );
}

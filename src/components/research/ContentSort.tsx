"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { researchContent } from "@/config";
import { shuffleWithPinned } from "@/lib/game/rng";
import type { MultiAnswer } from "@/lib/research/schema";
import { Button, Kbd } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CARD_SHADOW, DRAG_LIFT, FolderBucket } from "@/components/ui/DragKit";
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
      <p className="mb-3 text-center font-pixel text-xs uppercase text-muted" aria-live="polite">
        {finished ? `Sorted! ${mine.length} on your desk.` : `Card ${index + 1} of ${deck.length}`}
        {!finished ? <span className="block pt-1 normal-case sm:hidden">Drag the card, or just tap a folder.</span> : null}
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
              style={{ boxShadow: CARD_SHADOW }}
              whileDrag={DRAG_LIFT}
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
              className="w-full max-w-sm cursor-grab touch-none border-2 border-ink bg-paper text-center text-ink active:cursor-grabbing"
              data-testid="content-card"
            >
              <span aria-hidden className="grip block h-5 border-b-2 border-ink" />
              <span className="block px-5 py-5 text-xl font-bold">{current.label}</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 border-2 border-ink bg-mint px-4 py-2 font-pixel text-lg uppercase text-ink shadow-pixel">
              <Icon name="check" size={24} /> All sorted
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5">
        {(
          [
            ["mine", "On my desk", "1", "check", "mint", "MY_DESK/"],
            ["notme", "Not me", "2", "cross", "coral", "NOT_ME/"],
          ] as const
        ).map(([id, label, key, icon, tone, folder]) => (
          <FolderBucket
            key={id}
            drop={id}
            title={folder}
            tone={tone}
            hot={hover === id}
            disabled={finished}
            onClick={() => sort(id)}
            testId={`sort-${id}`}
            className="min-h-28 disabled:opacity-60"
            bodyClassName="text-lg font-bold"
          >
            <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-paper">
              <Icon name={icon} size={22} />
            </span>
            {label}
            <span className="hidden sm:block">
              <Kbd>{key}</Kbd>
            </span>
          </FolderBucket>
        ))}
      </div>
    </InterludeFrame>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { researchContent } from "@/config";
import { shuffleWithPinned } from "@/lib/game/rng";
import { toggleMulti, type MultiAnswer } from "@/lib/research/schema";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { clientPoint, dropTargetAt } from "@/components/game/hooks";
import { InterludeFrame, OptionCard } from "./InterludeFrame";

/**
 * Case files (challenges): tap-to-stamp, the same highlight gesture as
 * Terminology Detective. Multi-select; "None of these" is exclusive.
 */
export function CaseFiles({ seed, onDone }: { seed: number; onDone: (a: MultiAnswer) => void }) {
  const q = researchContent.questions.challenges;
  const options = useMemo(() => shuffleWithPinned(q.options, seed + 2, (o) => !!o.pinned), [q.options, seed]);
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <InterludeFrame
      testId="interlude-challenges"
      title="Which case files sound familiar?"
      subtitle="Stamp every real-world situation your team runs into. Pick as many as apply."
      onSkip={() => onDone({ status: "skipped" })}
      footer={
        <Button onClick={() => onDone({ status: "answered", values: picked })} disabled={picked.length === 0} iconAfter="arrow" data-testid="interlude-done">
          File my cases
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label={q.prompt}>
        {options.map((o) => {
          const on = picked.includes(o.id);
          return (
            <OptionCard
              key={o.id}
              label={o.label}
              selected={on}
              onClick={() => setPicked((p) => toggleMulti("challenges", p, o.id))}
              testId={`challenge-${o.id}`}
              icon={
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${on ? "bg-white text-purple-600" : "bg-white/10"}`}>
                  <Icon name={on ? "stamp" : "search"} size={20} />
                </span>
              }
            />
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-muted" aria-live="polite">
        {picked.length === 0 ? "Stamp at least one, choose “None of these”, or skip." : `${picked.length} stamped`}
      </p>
    </InterludeFrame>
  );
}

/**
 * Translation crew (tools): drag or tap tokens onto your team board, the same
 * move as assigning reviewers in Save the Launch.
 */
export function CrewBoard({ seed, onDone }: { seed: number; onDone: (a: MultiAnswer) => void }) {
  const q = researchContent.questions.tools;
  const options = useMemo(() => shuffleWithPinned(q.options, seed + 3, (o) => !!o.pinned), [q.options, seed]);
  const [crew, setCrew] = useState<string[]>([]);
  const [hover, setHover] = useState(false);
  const label = (id: string) => q.options.find((o) => o.id === id)?.label ?? id;

  return (
    <InterludeFrame
      testId="interlude-tools"
      title="Who's on your real translation crew?"
      subtitle="Drag or tap everyone and everything your team uses today."
      onSkip={() => onDone({ status: "skipped" })}
      footer={
        <Button onClick={() => onDone({ status: "answered", values: crew })} disabled={crew.length === 0} iconAfter="arrow" data-testid="interlude-done">
          That&apos;s my crew
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-wrap content-start gap-2" role="group" aria-label={q.prompt}>
          {options.map((o) => {
            const on = crew.includes(o.id);
            return (
              <motion.button
                key={o.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                drag={!on}
                dragSnapToOrigin
                whileDrag={{ scale: 1.08, zIndex: 20 }}
                onDrag={(e) => {
                  const p = clientPoint(e as PointerEvent);
                  setHover(!!p && dropTargetAt(p.x, p.y) === "crew");
                }}
                onDragEnd={(e) => {
                  setHover(false);
                  const p = clientPoint(e as PointerEvent);
                  if (p && dropTargetAt(p.x, p.y) === "crew") setCrew((c) => (c.includes(o.id) ? c : toggleMulti("tools", c, o.id)));
                }}
                onClick={() => setCrew((c) => toggleMulti("tools", c, o.id))}
                className={`flex min-h-14 touch-none items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition ${
                  on ? "border-purple-300 bg-purple-500/50 opacity-60" : "cursor-grab border-white/25 bg-navy-700 hover:border-blue-300"
                }`}
                data-testid={`tool-${o.id}`}
              >
                <Icon name={on ? "check" : "user"} size={18} />
                {o.label}
              </motion.button>
            );
          })}
        </div>
        <div
          data-drop="crew"
          className={`flex min-h-44 flex-col gap-2 rounded-3xl border-2 border-dashed p-4 transition ${hover ? "border-purple-300 bg-purple-500/20" : "border-white/30 bg-white/5"}`}
          aria-live="polite"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-muted">My crew board</p>
          {crew.length === 0 ? (
            <p className="m-auto text-muted">Drop crew members here</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {crew.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setCrew((c) => c.filter((x) => x !== id))}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-navy-950"
                    aria-label={`Remove ${label(id)}`}
                  >
                    {label(id)} <Icon name="cross" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </InterludeFrame>
  );
}

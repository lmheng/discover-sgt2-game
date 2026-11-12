"use client";

import { useCallback, useReducer, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { rushContent } from "@/config";
import { brandAssets } from "@/config/brand";
import type { DestinationId } from "@/config/schema";
import { initRush, remainingPatience, rushReducer, summarizeRush } from "@/lib/game/missions/rush";
import type { MissionResult } from "@/lib/game/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Kbd } from "@/components/ui/Button";
import { BlockBar } from "@/components/ui/PixelProgress";
import { CARD_SHADOW, DRAG_LIFT, FolderBucket } from "@/components/ui/DragKit";
import { clientPoint, dropTargetAt, useGameLoop, useKeys, useOnceWhen } from "@/components/game/hooks";
import { MissionShell } from "./MissionShell";

const cardById = new Map(rushContent.cards.map((c) => [c.id, c]));
const destIcon: Record<DestinationId, IconName> = { together: "chat", polyglot: "globe", api: "code" };

export function RushScene({
  durationMs,
  seed,
  completed,
  onComplete,
}: {
  durationMs: number;
  seed: number;
  completed: number;
  onComplete: (r: MissionResult) => void;
}) {
  const [state, dispatch] = useReducer(rushReducer, undefined, () => initRush(rushContent, durationMs, seed));
  const [hoverDock, setHoverDock] = useState<string | null>(null);
  const playing = state.status === "playing";

  useGameLoop((dt) => dispatch({ type: "tick", dtMs: dt }), playing);
  useOnceWhen(!playing, () => onComplete(summarizeRush(state)), 1100);

  const route = useCallback((destination: DestinationId, uid?: number) => dispatch({ type: "route", destination, uid }), []);

  useKeys((e) => {
    const d = rushContent.destinations.find((x) => x.key === e.key);
    if (d) {
      e.preventDefault();
      route(d.id);
    }
  }, playing);

  return (
    <MissionShell
      mission="rush"
      completed={completed}
      remainingMs={state.durationMs - state.elapsedMs}
      totalMs={state.durationMs}
      score={state.score}
      streak={state.streak}
      feedback={state.feedback}
      done={!playing}
    >
      <p className="mb-2 text-center text-sm text-muted">
        Drag each request to the right tool, or tap a card then a tool. Keys <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> route
        the {state.selectedUid ? "selected" : "front"} card.
      </p>

      {/* Incoming requests */}
      <div className="relative flex min-h-[15rem] flex-1 flex-col items-stretch justify-center gap-3 sm:min-h-[13rem] sm:flex-row sm:items-center" aria-label="Incoming requests">
        <AnimatePresence initial={false} mode="popLayout">
          {state.active.map((c, i) => {
            const card = cardById.get(c.cardId)!;
            const remaining = remainingPatience(c, state.elapsedMs);
            const frac = remaining / c.patienceMs;
            const selected = state.selectedUid === c.uid;
            return (
              <motion.div
                key={c.uid}
                layout
                initial={{ opacity: 0, x: 80, rotate: 4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 60, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                drag
                dragSnapToOrigin
                dragElastic={0.6}
                style={{ boxShadow: CARD_SHADOW }}
                whileDrag={DRAG_LIFT}
                onDrag={(e) => {
                  const p = clientPoint(e as PointerEvent);
                  const t = p ? dropTargetAt(p.x, p.y) : null;
                  if (t !== hoverDock) setHoverDock(t);
                }}
                onDragEnd={(e) => {
                  setHoverDock(null);
                  const p = clientPoint(e as PointerEvent);
                  const t = p ? dropTargetAt(p.x, p.y) : null;
                  if (t === "together" || t === "polyglot" || t === "api") route(t, c.uid);
                }}
                className={`touch-none cursor-grab border-2 border-ink bg-paper active:cursor-grabbing sm:w-72 ${
                  selected ? "outline-4 outline-offset-2 outline-witty-red" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => dispatch({ type: "select", uid: c.uid })}
                  aria-pressed={selected}
                  aria-label={`Request: ${card.text}. ${Math.ceil(remaining / 1000)} seconds left.${i === 0 ? " Front of queue." : ""}`}
                  className="relative block w-full cursor-grab text-left text-ink active:cursor-grabbing"
                  data-testid="rush-card"
                  data-answer={card.answer}
                >
                  {/* Grip bar: the dialog's draggable title strip. */}
                  <span className={`flex h-6 items-center justify-between border-b-2 border-ink px-1.5 ${selected ? "bg-coral" : "grip"}`}>
                    <span className="border-2 border-ink bg-butter px-1.5 font-pixel text-[0.65rem] uppercase leading-4 text-ink">
                      {card.tag}
                    </span>
                    {selected ? (
                      <span className="inline-flex items-center gap-1 border-2 border-ink bg-paper px-1.5 font-pixel text-[0.65rem] uppercase leading-4 text-witty-red-ink">
                        <Icon name="check" size={11} strokeWidth={3.5} /> Selected
                      </span>
                    ) : (
                      <span aria-hidden className="flex h-4 w-4 items-center justify-center border-2 border-ink bg-witty-red text-white">
                        <Icon name="cross" size={9} strokeWidth={4} />
                      </span>
                    )}
                  </span>
                  <span className="block px-3 pb-3 pt-2">
                    <span className="block text-base font-semibold leading-snug sm:text-lg">{card.text}</span>
                    <BlockBar fraction={frac} blocks={10} tone={frac < 0.33 ? "red" : "forest"} className="mt-3" height="h-2" />
                  </span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {state.active.length === 0 && playing ? (
          <p className="text-center font-pixel uppercase text-muted">Incoming…</p>
        ) : null}
      </div>

      {/* Destination docks: open retro folders with checkerboard drop zones */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label="Destinations">
        {rushContent.destinations.map((d) => {
          const hot = hoverDock === d.id;
          const armed = state.selectedUid !== null && playing;
          const icon = brandAssets.productIcons[d.id];
          return (
            <FolderBucket
              key={d.id}
              drop={d.id}
              onClick={() => route(d.id)}
              disabled={!playing || state.active.length === 0}
              hot={hot}
              armed={armed}
              title={`${d.id}/`}
              testId={`dock-${d.id}`}
              className="min-h-28 sm:min-h-36"
            >
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element -- local brand icon
                <img src={icon} alt="" width={36} height={36} />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-paper">
                  <Icon name={destIcon[d.id]} size={24} />
                </span>
              )}
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted sm:text-xs">{d.job}</span>
              <span className="text-sm font-bold leading-tight sm:text-base">{d.product}</span>
              <span className="mt-1 hidden sm:block">
                <Kbd>{d.key}</Kbd>
              </span>
            </FolderBucket>
          );
        })}
      </div>
    </MissionShell>
  );
}

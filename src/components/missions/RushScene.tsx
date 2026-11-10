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
                whileDrag={{ scale: 1.06, rotate: -2, zIndex: 30 }}
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
                className="touch-none sm:w-72"
              >
                <button
                  type="button"
                  onClick={() => dispatch({ type: "select", uid: c.uid })}
                  aria-pressed={selected}
                  aria-label={`Request: ${card.text}. ${Math.ceil(remaining / 1000)} seconds left.${i === 0 ? " Front of queue." : ""}`}
                  className={`relative block w-full cursor-grab rounded-2xl border-2 bg-white px-4 pb-4 pt-3 text-left text-navy-950 shadow-xl transition active:cursor-grabbing ${
                    selected ? "border-purple-500 ring-4 ring-purple-400/70" : "border-transparent"
                  }`}
                  data-testid="rush-card"
                  data-answer={card.answer}
                >
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-blue-600">
                    {card.tag}
                  </span>
                  {selected ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">
                      <Icon name="check" size={12} /> Selected
                    </span>
                  ) : null}
                  <span className="block text-base font-semibold leading-snug sm:text-lg">{card.text}</span>
                  <span className="mt-3 block h-2 overflow-hidden rounded-full bg-navy-950/10" aria-hidden>
                    <span
                      className={`block h-full rounded-full ${frac < 0.33 ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${frac * 100}%` }}
                    />
                  </span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {state.active.length === 0 && playing ? (
          <p className="text-center text-muted">Incoming…</p>
        ) : null}
      </div>

      {/* Destination docks */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label="Destinations">
        {rushContent.destinations.map((d) => {
          const hot = hoverDock === d.id;
          const icon = brandAssets.productIcons[d.id];
          return (
            <button
              key={d.id}
              type="button"
              data-drop={d.id}
              onClick={() => route(d.id)}
              disabled={!playing || state.active.length === 0}
              className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition sm:min-h-36 ${
                hot
                  ? "scale-105 border-blue-300 bg-blue-500/40"
                  : "border-white/20 bg-gradient-to-b from-navy-700 to-navy-800 hover:border-blue-300/70"
              }`}
              data-testid={`dock-${d.id}`}
            >
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element -- local brand icon
                <img src={icon} alt="" width={36} height={36} />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon name={destIcon[d.id]} size={24} />
                </span>
              )}
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-blue-300 sm:text-xs">{d.job}</span>
              <span className="text-sm font-bold leading-tight sm:text-base">{d.product}</span>
              <span className="mt-1 hidden sm:block">
                <Kbd>{d.key}</Kbd>
              </span>
            </button>
          );
        })}
      </div>
    </MissionShell>
  );
}

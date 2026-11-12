"use client";

import { motion, useReducedMotion } from "motion/react";
import { Witty } from "@/components/mascot/Witty";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MISSION_TITLES, missionIds } from "@/lib/game/types";
import { useMediaQuery } from "./hooks";

const missionIcon: IconName[] = ["bolt", "search", "rocket"];

/** Node anchor points (percent of the map box): START pad, then stages 1-3 on a winding trail. */
const POINTS = [
  { x: 7, y: 72 },
  { x: 31, y: 34 },
  { x: 59, y: 70 },
  { x: 87, y: 32 },
] as const;
const TRAIL = "M7 72 C 19 72, 19 34, 31 34 S 47 70, 59 70 S 75 32, 87 32";
const CHEVRONS = [
  { x: 19, y: 53 },
  { x: 45, y: 52 },
  { x: 73, y: 51 },
];

const pointFor = (stageIndex: number) => POINTS[Math.max(-1, Math.min(2, stageIndex)) + 1]!;

/**
 * The three-stage trail. Stages are mini retro windows (STAGE_0N.EXE); wiTTy hops
 * from `hopFrom` to `wittyAt` with spring physics (instant under reduced motion).
 * Index -1 is the START pad.
 */
export function StageMap({
  stage,
  completed,
  wittyAt,
  hopFrom,
  onEnter,
}: {
  /** The stage to highlight as "next" (0-2). */
  stage: number;
  completed: number;
  wittyAt: number;
  hopFrom?: number;
  onEnter?: () => void;
}) {
  const reduce = useReducedMotion();
  const wide = useMediaQuery("(min-width: 640px)");
  const to = pointFor(wittyAt);
  const from = pointFor(hopFrom ?? wittyAt);
  const hops = !reduce && hopFrom !== undefined && hopFrom !== wittyAt;

  return (
    <div className="checker relative h-52 w-full border-2 border-ink shadow-pixel sm:h-72" data-testid="stage-map">
      {/* Trail: dashed pixel path + >>> markers */}
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={TRAIL} fill="none" stroke="#fffdf9" strokeWidth={10} vectorEffect="non-scaling-stroke" />
        <path
          d={TRAIL}
          fill="none"
          stroke="#2c2523"
          strokeWidth={3}
          strokeDasharray="8 6"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {CHEVRONS.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 border-ink px-1 font-pixel text-[0.65rem] leading-4 sm:text-xs ${
            i < completed || (i === 0 && wittyAt >= 0) ? "bg-mint text-ink" : "bg-paper text-muted"
          }`}
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          &gt;&gt;&gt;
        </span>
      ))}

      <ol className="contents" aria-label="Stage map">
        <li
          className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: `${POINTS[0].x}%`, top: `${POINTS[0].y}%` }}
        >
          <span className="border-2 border-ink bg-butter px-1.5 py-1 font-pixel text-[0.6rem] uppercase leading-none shadow-pixel-sm sm:text-xs">
            Start
          </span>
        </li>
        {missionIds.map((m, i) => {
          const p = POINTS[i + 1]!;
          const done = i < completed;
          const current = !done && i === stage;
          const status = done ? "complete" : current ? "up next" : "locked";
          const bar = done ? "bg-mint" : current ? "bg-coral" : "bg-checker";
          const body = (
            <>
              <span className={`flex items-center justify-between gap-1 border-b-2 border-ink px-1 py-0.5 ${bar}`}>
                <span className="font-pixel text-[0.6rem] uppercase leading-none sm:text-[0.7rem]">
                  <span className="sm:hidden">0{i + 1}.EXE</span>
                  <span className="hidden sm:inline">STAGE_0{i + 1}.EXE</span>
                </span>
                <span aria-hidden className={`hidden h-3 w-3 border-2 border-ink sm:block ${current ? "bg-witty-red" : "bg-paper"}`} />
              </span>
              <span className={`flex flex-col items-center gap-1 px-1 py-1.5 sm:py-2 ${done || current ? "bg-paper" : "checker"}`}>
                <span
                  className={`flex h-7 w-7 items-center justify-center border-2 border-ink sm:h-9 sm:w-9 ${
                    done ? "bg-forest text-paper" : current ? "bg-witty-red text-white" : "bg-paper text-muted"
                  }`}
                >
                  <Icon name={done ? "check" : current ? missionIcon[i]! : "lock"} size={wide ? 20 : 16} strokeWidth={3} />
                </span>
                <span className={`hidden text-center text-xs font-bold leading-tight sm:block ${done || current ? "text-ink" : "text-muted"}`}>
                  {MISSION_TITLES[m]}
                </span>
              </span>
              <span className="sr-only">
                Stage {i + 1}: {MISSION_TITLES[m]}, {status}
              </span>
            </>
          );
          const cls = `flex w-[4.75rem] flex-col border-2 border-ink text-ink sm:w-36 ${
            current ? "animate-pulse-ring shadow-pixel outline-2 outline-offset-2 outline-witty-red" : done ? "shadow-pixel" : "shadow-pixel-sm"
          }`;
          return (
            <li key={m} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {current && onEnter ? (
                <button type="button" onClick={onEnter} className={`retro-press ${cls}`} data-testid={`stage-node-${i + 1}`}>
                  {body}
                </button>
              ) : (
                <div className={cls} data-testid={`stage-node-${i + 1}`} data-status={status}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* wiTTy hops along the trail. Decorative: the stage list carries the meaning. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2"
        style={{ marginTop: wide ? -92 : -64 }}
        initial={hops ? { left: `${from.x}%`, top: `${from.y}%`, y: 0 } : false}
        animate={{ left: `${to.x}%`, top: `${to.y}%`, y: hops ? [0, -56, 0, -12, 0] : 0 }}
        transition={{
          left: { type: "spring", stiffness: 220, damping: 16, delay: 0.25 },
          top: { type: "spring", stiffness: 220, damping: 16, delay: 0.25 },
          y: { duration: 0.9, times: [0, 0.4, 0.7, 0.85, 1], ease: "easeOut", delay: 0.25 },
        }}
      >
        <Witty pose={hops ? "celebrate" : "idle"} size={wide ? 64 : 44} decorative />
      </motion.div>
    </div>
  );
}

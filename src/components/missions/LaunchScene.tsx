"use client";

import { useReducer, useState } from "react";
import { motion } from "motion/react";
import { launchContent } from "@/config";
import type { LanguageId } from "@/config/schema";
import { initLaunch, launchReducer, summarizeLaunch, type LaneStage, type LaneState } from "@/lib/game/missions/launch";
import type { MissionResult } from "@/lib/game/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { clientPoint, dropTargetAt, useGameLoop, useOnceWhen } from "@/components/game/hooks";
import { MissionShell } from "./MissionShell";

const laneMeta = new Map(launchContent.lanes.map((l) => [l.id, l]));
const reviewerName = new Map(launchContent.reviewers.map((r) => [r.id, r.name]));

const PIPELINE: { stage: LaneStage[]; label: string; icon: IconName }[] = [
  { stage: ["draft"], label: "Draft", icon: "chat" },
  { stage: ["translating", "translated"], label: "AI draft", icon: "bolt" },
  { stage: ["reviewing", "issue"], label: "Review", icon: "user" },
  { stage: ["approved"], label: "Approved", icon: "check" },
  { stage: ["published"], label: "Live", icon: "rocket" },
];

function stepIndex(stage: LaneStage) {
  return PIPELINE.findIndex((p) => p.stage.includes(stage));
}

function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="w-full" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((value / total) * 100)}>
      <p className="mb-1 text-sm font-semibold text-blue-300">{label}</p>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function LaunchScene({
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
  const [state, dispatch] = useReducer(launchReducer, undefined, () => initLaunch(launchContent, durationMs, seed));
  const [hoverLane, setHoverLane] = useState<string | null>(null);
  const playing = state.status === "playing";
  useGameLoop((dt) => dispatch({ type: "tick", dtMs: dt }), playing);
  useOnceWhen(!playing, () => onComplete(summarizeLaunch(state)), 1300);

  const allLive = state.lanes.every((l) => l.stage === "published");

  const laneAction = (lane: LaneState) => {
    const id = lane.id;
    switch (lane.stage) {
      case "draft":
        return (
          <button type="button" onClick={() => dispatch({ type: "runSgt", laneId: id })} className="lane-btn bg-blue-500 text-white" data-testid={`run-${id}`}>
            <Icon name="bolt" size={18} /> Run SGT
          </button>
        );
      case "translating":
        return <Progress value={lane.progressMs} total={state.translateMs} label="SGT translating…" />;
      case "translated":
        return (
          <div className="flex w-full flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "assignReviewer", laneId: id })}
              className="lane-btn flex-1 bg-purple-500 text-white"
              data-testid={`review-${id}`}
            >
              <Icon name="user" size={18} /> {state.selectedReviewerId ? `Assign ${reviewerName.get(state.selectedReviewerId)}` : "Send for review"}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "publish", laneId: id })}
              className="lane-btn border-2 border-white/30 bg-transparent text-ink"
              data-testid={`publish-${id}`}
            >
              <Icon name="rocket" size={18} /> Publish now
            </button>
          </div>
        );
      case "reviewing":
        return (
          <Progress
            value={lane.progressMs}
            total={state.reviewMs}
            label={`${reviewerName.get(lane.reviewerId ?? "") ?? "Reviewer"} reviewing…`}
          />
        );
      case "issue":
        return (
          <div className="w-full">
            <p className="mb-2 flex items-start gap-1.5 text-sm font-medium text-red-400">
              <Icon name="alert" size={18} className="shrink-0" /> {laneMeta.get(id)?.issue}
            </p>
            <button type="button" onClick={() => dispatch({ type: "fixIssue", laneId: id })} className="lane-btn w-full bg-red-500 text-white" data-testid={`fix-${id}`}>
              <Icon name="check" size={18} /> Apply glossary fix
            </button>
          </div>
        );
      case "approved":
        return (
          <button type="button" onClick={() => dispatch({ type: "publish", laneId: id })} className="lane-btn w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white" data-testid={`publish-${id}`}>
            <Icon name="rocket" size={18} /> Publish
          </button>
        );
      case "published":
        return (
          <p className="flex items-center gap-2 text-lg font-bold text-blue-300">
            <Icon name="check" size={22} /> Live
          </p>
        );
    }
  };

  return (
    <MissionShell
      mission="launch"
      completed={completed}
      remainingMs={state.durationMs - state.elapsedMs}
      totalMs={state.durationMs}
      score={state.score}
      streak={state.streak}
      feedback={state.feedback}
      done={!playing}
      doneLabel={allLive ? "Launched!" : "Time!"}
    >
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="glass flex-1 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{launchContent.agency}</p>
          <p className="text-lg font-bold">{launchContent.announcement}</p>
          <p className="text-sm text-blue-300">English source approved · translate, review and publish all three languages</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Reviewers">
          {state.reviewers.map((r) => {
            const busy = r.laneId !== null;
            const selected = state.selectedReviewerId === r.id;
            return (
              <motion.button
                key={r.id}
                type="button"
                drag={!busy}
                dragSnapToOrigin
                whileDrag={{ scale: 1.1, zIndex: 30 }}
                onDrag={(e) => {
                  const p = clientPoint(e as PointerEvent);
                  const t = p ? dropTargetAt(p.x, p.y) : null;
                  if (t !== hoverLane) setHoverLane(t);
                }}
                onDragEnd={(e) => {
                  setHoverLane(null);
                  const p = clientPoint(e as PointerEvent);
                  const t = p ? dropTargetAt(p.x, p.y) : null;
                  if (t?.startsWith("lane-")) dispatch({ type: "assignReviewer", laneId: t.slice(5) as LanguageId, reviewerId: r.id });
                }}
                onClick={() => dispatch({ type: "selectReviewer", reviewerId: r.id })}
                disabled={busy || !playing}
                aria-pressed={selected}
                className={`flex min-h-14 touch-none items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left ${
                  selected ? "border-purple-300 bg-purple-500/40 ring-4 ring-purple-400/50" : busy ? "border-white/10 bg-white/5 opacity-60" : "cursor-grab border-white/30 bg-navy-700"
                }`}
                data-testid={`reviewer-${r.id}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Icon name="user" size={20} />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold">{reviewerName.get(r.id)}</span>
                  <span className="block text-xs text-muted">{busy ? `Reviewing ${laneMeta.get(r.laneId!)?.label}` : "Available"}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid flex-1 gap-3 md:grid-cols-3">
        {state.lanes.map((lane) => {
          const meta = laneMeta.get(lane.id)!;
          const idx = stepIndex(lane.stage);
          const showText = idx >= 1 && lane.stage !== "translating";
          return (
            <div
              key={lane.id}
              data-drop={`lane-${lane.id}`}
              className={`flex flex-col gap-3 rounded-2xl border-2 p-3 transition sm:p-4 ${
                hoverLane === `lane-${lane.id}` ? "border-purple-300 bg-purple-500/20" : lane.stage === "published" ? "border-blue-300 bg-blue-500/15" : "border-white/15 bg-navy-800/80"
              }`}
              data-testid={`lane-${lane.id}`}
              data-stage={lane.stage}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" lang={lane.id}>{meta.label}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{PIPELINE[idx]?.label}</span>
              </div>
              <ol className="hidden items-center gap-1 sm:flex" aria-label={`Stage: ${PIPELINE[idx]?.label}`}>
                {PIPELINE.map((p, i) => (
                  <li key={p.label} className="flex flex-1 items-center gap-1">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                        i < idx ? "border-blue-300 bg-blue-500 text-white" : i === idx ? "border-purple-300 bg-purple-500/40" : "border-white/20 text-white/40"
                      }`}
                      title={p.label}
                    >
                      <Icon name={i < idx ? "check" : p.icon} size={14} />
                    </span>
                    {i < PIPELINE.length - 1 ? <span className={`h-0.5 flex-1 ${i < idx ? "bg-blue-300" : "bg-white/15"}`} /> : null}
                  </li>
                ))}
              </ol>
              <p lang={lane.id} className={`min-h-12 rounded-xl px-3 py-2 text-sm ${showText ? "bg-white text-navy-950" : "bg-white/5 text-muted"}`}>
                {showText ? meta.sample : "Waiting for translation…"}
              </p>
              <div className="mt-auto flex min-h-12 items-center">{laneAction(lane)}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-muted">
        <Icon name="info" size={16} /> AI translations may need human review before publication. Sample text is illustrative.
      </p>
    </MissionShell>
  );
}

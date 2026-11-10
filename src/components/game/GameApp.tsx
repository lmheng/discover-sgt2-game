"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { getEventConfig } from "@/config";
import { startBackgroundSync, track } from "@/lib/analytics/client";
import { gameplayRecord, interestRecord, newId, researchRecord, type Envelope } from "@/lib/analytics/records";
import { summarizeRun } from "@/lib/game/badges";
import { buildRunPlan, currentStep, flowReducer, type FlowState, type InterludeQuestion, type RunStep } from "@/lib/game/flow";
import { randomSeed } from "@/lib/game/rng";
import { missionIds, type MissionId, type MissionResult } from "@/lib/game/types";
import type { ResearchAnswers } from "@/lib/research/schema";
import { playSound, setMuted } from "@/lib/sound";
import { RushScene } from "@/components/missions/RushScene";
import { DetectiveScene } from "@/components/missions/DetectiveScene";
import { LaunchScene } from "@/components/missions/LaunchScene";
import { DeskSetup } from "@/components/research/DeskSetup";
import { ContentSort } from "@/components/research/ContentSort";
import { CaseFiles, CrewBoard } from "@/components/research/MultiPick";
import { PowerUpPick } from "@/components/research/PowerUpPick";
import { KioskLayer } from "@/components/kiosk/KioskLayer";
import { GameContext, type GameMode } from "./GameContext";
import {
  AttractScreen,
  InterestScreen,
  MissionIntro,
  MissionResultCard,
  ResultsScreen,
  ThanksScreen,
  TitleScreen,
} from "./Screens";

type ResearchKey = "desk" | InterludeQuestion;

interface Attempt {
  gameSessionId: string;
  seed: number;
  startedAt: number;
}

const VISIT_KEY = "witty-visit-id";

function initialVisitId(mode: GameMode): string {
  // Mobile: keep one visit per browser tab session so refreshes don't create new "visitors".
  if (mode === "mobile" && typeof window !== "undefined") {
    try {
      const existing = sessionStorage.getItem(VISIT_KEY);
      if (existing) return existing;
      const id = newId();
      sessionStorage.setItem(VISIT_KEY, id);
      return id;
    } catch {
      // Storage unavailable: fall through.
    }
  }
  return newId();
}

export function GameApp({ mode }: { mode: GameMode }) {
  const event = useMemo(() => getEventConfig(), []);
  const [flow, dispatch] = useReducer(flowReducer, undefined, (): FlowState =>
    mode === "kiosk" ? { phase: "attract" } : { phase: "title" },
  );
  const [visitId, setVisitId] = useState(() => initialVisitId(mode));
  const [visitSeed, setVisitSeed] = useState(() => randomSeed());
  const [answers, setAnswers] = useState<ResearchAnswers>({});
  const researchDone = useRef<Set<ResearchKey>>(new Set());
  const [results, setResults] = useState<MissionResult[]>([]);
  const attempt = useRef<Attempt | null>(null);
  const [attemptSeed, setAttemptSeed] = useState(1);
  const [muted, setMutedState] = useState(true);
  const completedLogged = useRef<string | null>(null);

  const env: Envelope = useMemo(() => ({ visitId, eventCode: event.id, source: mode }), [visitId, event.id, mode]);

  useEffect(() => startBackgroundSync(), []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  }, []);

  const plan = useCallback(
    () =>
      buildRunPlan({
        missions: missionIds,
        researchEnabled: event.researchEnabled,
        researchDone: researchDone.current,
      }),
    [event.researchEnabled],
  );

  const newAttempt = useCallback(
    (attemptNo: number) => {
      const a: Attempt = { gameSessionId: newId(), seed: randomSeed(), startedAt: Date.now() };
      attempt.current = a;
      setAttemptSeed(a.seed);
      setResults([]);
      void track(gameplayRecord(env, { type: "session_started", gameSessionId: a.gameSessionId, attempt: attemptNo }));
    },
    [env],
  );

  const skip = useCallback(
    (step: RunStep) => step.kind === "interlude" && researchDone.current.has(step.question),
    [],
  );
  const next = useCallback(() => dispatch({ type: "next", skip }), [skip]);

  const start = useCallback(() => {
    if (flow.phase === "attract") dispatch({ type: "wake" });
    newAttempt(1);
    dispatch({ type: "begin", plan: plan() });
  }, [flow.phase, newAttempt, plan]);

  const replay = useCallback(() => {
    const attemptNo = flow.phase === "run" ? flow.attempt : "attempt" in flow ? flow.attempt + 1 : 1;
    newAttempt(attemptNo);
    dispatch({ type: "replay", plan: plan() });
  }, [flow, newAttempt, plan]);

  const recordResearch = useCallback(
    (partial: ResearchAnswers, keys: ResearchKey[]) => {
      const merged: ResearchAnswers = { ...answers, ...partial };
      for (const k of keys) researchDone.current.add(k);
      // No content-type question for people who never translate.
      if (merged.frequency?.status === "answered" && merged.frequency.value === "never" && !merged.contentTypes) {
        merged.contentTypes = { status: "not_applicable" };
        researchDone.current.add("contentTypes");
      }
      setAnswers(merged);
      void track(researchRecord(env, merged));
      next();
    },
    [answers, env, next],
  );

  const onMissionComplete = useCallback(
    (r: MissionResult) => {
      setResults((prev) => [...prev, r]);
      const a = attempt.current;
      if (a) {
        void track(
          gameplayRecord(env, {
            type: "mission_completed",
            gameSessionId: a.gameSessionId,
            attempt: flow.phase === "run" ? flow.attempt : 1,
            mission: r.mission,
            score: r.score,
            success: r.success,
            durationMs: r.durationMs,
          }),
        );
      }
      next();
    },
    [env, flow, next],
  );

  const summary = useMemo(() => summarizeRun(results), [results]);

  // Log completion once per attempt when the results screen is reached.
  useEffect(() => {
    if (flow.phase !== "results" || !attempt.current) return;
    const a = attempt.current;
    if (completedLogged.current === a.gameSessionId) return;
    completedLogged.current = a.gameSessionId;
    playSound("complete");
    void track(
      gameplayRecord(env, {
        type: "session_completed",
        gameSessionId: a.gameSessionId,
        attempt: flow.attempt,
        totalScore: summary.totalScore,
        tier: summary.tier,
        durationMs: Math.min(Date.now() - a.startedAt, 30 * 60_000),
        missionsSucceeded: summary.missionsSucceeded,
      }),
    );
  }, [flow, env, summary]);

  const resetVisit = useCallback(
    (reason: "idle_reset" | "staff_reset") => {
      const a = attempt.current;
      if (flow.phase === "run" && a) {
        void track(
          gameplayRecord(env, {
            type: "session_abandoned",
            gameSessionId: a.gameSessionId,
            attempt: flow.attempt,
            reason,
            stepKind: currentStep(flow)?.kind ?? "unknown",
          }),
        );
      }
      attempt.current = null;
      researchDone.current = new Set();
      setAnswers({});
      setResults([]);
      setVisitId(newId());
      setVisitSeed(randomSeed());
      dispatch({ type: "reset" });
      if (mode === "mobile") dispatch({ type: "wake" });
    },
    [env, flow, mode],
  );

  const goHome = useCallback(() => {
    if (mode === "kiosk") resetVisit("staff_reset");
    else dispatch({ type: "reset" });
  }, [mode, resetVisit]);

  /* ------------------------------ render ------------------------------ */

  const step = currentStep(flow);
  const screenKey =
    flow.phase === "run" ? `run-${flow.attempt}-${flow.index}` : flow.phase === "attract" && mode === "mobile" ? "title" : flow.phase;
  const completed = results.length;
  const missionIndex = (m: MissionId) => missionIds.indexOf(m);

  const renderStep = (s: RunStep) => {
    switch (s.kind) {
      case "desk":
        return (
          <DeskSetup
            seed={visitSeed}
            onDone={(a) => recordResearch({ workFunction: a.workFunction, frequency: a.frequency }, ["desk"])}
          />
        );
      case "intro":
        return <MissionIntro mission={s.mission} index={missionIndex(s.mission)} onStart={next} />;
      case "play": {
        const durationMs = event.missions[s.mission].durationMs;
        const props = { durationMs, seed: attemptSeed + missionIndex(s.mission), completed, onComplete: onMissionComplete };
        if (s.mission === "rush") return <RushScene {...props} />;
        if (s.mission === "detective") return <DetectiveScene {...props} />;
        return <LaunchScene {...props} />;
      }
      case "missionResult": {
        const r = [...results].reverse().find((x) => x.mission === s.mission);
        return r ? <MissionResultCard result={r} onNext={next} /> : null;
      }
      case "interlude":
        switch (s.question) {
          case "contentTypes":
            return <ContentSort seed={visitSeed} onDone={(a) => recordResearch({ contentTypes: a }, ["contentTypes"])} />;
          case "challenges":
            return <CaseFiles seed={visitSeed} onDone={(a) => recordResearch({ challenges: a }, ["challenges"])} />;
          case "tools":
            return <CrewBoard seed={visitSeed} onDone={(a) => recordResearch({ tools: a }, ["tools"])} />;
          case "capability":
            return <PowerUpPick seed={visitSeed} onDone={(a) => recordResearch({ capability: a }, ["capability"])} />;
        }
    }
  };

  const renderScreen = () => {
    switch (flow.phase) {
      case "attract":
        return mode === "kiosk" ? <AttractScreen onWake={() => dispatch({ type: "wake" })} /> : <TitleScreen onStart={start} />;
      case "title":
        return <TitleScreen onStart={start} />;
      case "run":
        return step ? renderStep(step) : null;
      case "results":
        return (
          <ResultsScreen
            summary={summary}
            onReplay={replay}
            onInterest={() => dispatch({ type: "showInterest" })}
            onFinish={() => dispatch({ type: "finish" })}
          />
        );
      case "interest":
        return (
          <InterestScreen
            onExpressed={() => void track(interestRecord(env, "interest_expressed"))}
            onDeclined={() => void track(interestRecord(env, "interest_declined"))}
            onQrShown={() => void track(interestRecord(env, "formsg_qr_shown"))}
            onLinkOpened={() => void track(interestRecord(env, "formsg_link_opened"))}
            onDone={() => dispatch({ type: "finish" })}
          />
        );
      case "thanks":
        return <ThanksScreen onReplay={replay} onHome={goHome} />;
    }
  };

  const idleAfterMs = flow.phase === "run" ? event.kiosk.idleWarningMs : event.kiosk.resultsTimeoutMs;

  return (
    <GameContext.Provider value={{ event, mode, muted, toggleMute }}>
      <MotionConfig reducedMotion="user">
        <div
          className={`arcade-bg relative min-h-dvh overflow-x-hidden ${mode === "kiosk" ? "kiosk" : ""}`}
          onContextMenu={mode === "kiosk" ? (e) => e.preventDefault() : undefined}
          data-mode={mode}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={screenKey}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-dvh"
            >
              {renderScreen()}
            </motion.main>
          </AnimatePresence>
          {mode === "kiosk" ? (
            <KioskLayer
              idleEnabled={flow.phase !== "attract"}
              idleAfterMs={idleAfterMs}
              onIdleReset={() => resetVisit("idle_reset")}
              onStaffReset={() => resetVisit("staff_reset")}
            />
          ) : null}
        </div>
      </MotionConfig>
    </GameContext.Provider>
  );
}

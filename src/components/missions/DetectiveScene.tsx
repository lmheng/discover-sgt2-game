"use client";

import { useReducer } from "react";
import { AnimatePresence, motion } from "motion/react";
import { detectiveContent } from "@/config";
import {
  currentRoundId,
  detectiveReducer,
  hintVisible,
  initDetective,
  summarizeDetective,
} from "@/lib/game/missions/detective";
import type { MissionResult } from "@/lib/game/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useGameLoop, useOnceWhen } from "@/components/game/hooks";
import { MissionShell } from "./MissionShell";

const roundById = new Map(detectiveContent.rounds.map((r) => [r.id, r]));

/** Highlights glossary-term occurrences in the English source with a diamond marker. */
function EnglishWithMarkers({ text, term }: { text: string; term: string }) {
  const parts = text.split(term);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 ? (
            <mark className="border-b-2 border-ink bg-butter px-1 font-semibold text-ink">
              <span aria-hidden>◆ </span>
              {term}
            </mark>
          ) : null}
        </span>
      ))}
    </>
  );
}

export function DetectiveScene({
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
  const [state, dispatch] = useReducer(detectiveReducer, undefined, () =>
    initDetective(detectiveContent, durationMs, seed),
  );
  const playing = state.status === "playing";
  useGameLoop((dt) => dispatch({ type: "tick", dtMs: dt }), playing);
  useOnceWhen(!playing, () => onComplete(summarizeDetective(state)), 1100);

  const roundId = currentRoundId(state);
  const round = roundId ? roundById.get(roundId) : undefined;
  const hint = hintVisible(state);

  return (
    <MissionShell
      mission="detective"
      completed={completed}
      remainingMs={state.durationMs - state.elapsedMs}
      totalMs={state.durationMs}
      score={state.score}
      streak={state.streak}
      feedback={state.feedback}
      done={!playing}
      doneLabel={state.solves.length === state.roundIds.length ? "Case closed!" : "Time!"}
    >
      {round ? (
        <AnimatePresence mode="wait">
          <motion.article
            key={round.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
            aria-label={`Case ${state.roundIndex + 1} of ${state.roundIds.length}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-pixel text-xs uppercase text-ink sm:text-sm">
                Case {state.roundIndex + 1} of {state.roundIds.length} · {round.agency}
              </p>
              <p className="inline-flex items-center gap-1.5 border-2 border-dashed border-ink bg-paper px-3 py-1 text-xs font-semibold text-muted">
                <Icon name="info" size={14} /> Illustrative example: not an official translation
              </p>
            </div>

            {/* Approved glossary entry */}
            <div className="flex flex-wrap items-center gap-2 border-2 border-ink bg-butter px-4 py-3 shadow-pixel">
              <span className="font-pixel text-xs uppercase text-ink">GLOSSARY.TXT</span>
              <span className="font-semibold">◆ {round.glossary.en}</span>
              <Icon name="arrow" size={18} className="text-ink" />
              <span lang={round.language} className="border-2 border-ink bg-paper px-2.5 py-1 text-lg font-bold text-ink" data-testid="glossary-target">
                {round.glossary.target}
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
              <div className="checker order-2 border-2 border-ink p-3 text-sm shadow-pixel-sm sm:p-4 sm:text-base lg:order-none">
                <h3 className="mb-1 font-pixel text-xs uppercase text-muted">English source · {round.title}</h3>
                <p className="leading-relaxed">
                  <EnglishWithMarkers text={round.english} term={round.glossary.en} />
                </p>
              </div>
              <div className="order-1 border-2 border-ink bg-paper p-4 text-ink shadow-pixel lg:order-none">
                <h3 className="mb-2 flex items-center gap-2 font-pixel text-xs uppercase text-ink">
                  <Icon name="search" size={16} /> {round.languageLabel} draft: tap the term that doesn&apos;t match the glossary
                </h3>
                <div className="flex flex-wrap gap-1.5" lang={round.language} role="group" aria-label="Translated announcement segments">
                  {round.target.map((seg, i) => {
                    const isTerm = "term" in seg;
                    const text = isTerm ? seg.term : seg.text;
                    const wrong = state.wrongTapIndices.includes(i);
                    const solved = state.revealing?.segmentIndex === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!playing || !!state.revealing || wrong}
                        onClick={() => dispatch({ type: "tap", segmentIndex: i })}
                        className={`relative min-h-11 border-2 px-2 py-1 text-lg leading-snug transition ${
                          solved
                            ? "border-ink bg-mint font-bold shadow-pixel-sm"
                            : wrong
                              ? "border-dashed border-ink bg-coral/40 text-muted line-through"
                              : hint && isTerm
                                ? "border-dotted border-ink bg-butter/60 hover:bg-butter"
                                : "border-transparent hover:border-ink hover:bg-checker"
                        }`}
                        data-testid="detective-segment"
                        data-odd={isTerm && seg.odd ? "true" : undefined}
                        aria-label={`${text}${wrong ? " (matches, ruled out)" : ""}${solved ? " (inconsistent term found)" : ""}`}
                      >
                        {hint && isTerm && !wrong ? <span aria-hidden className="mr-1 text-sm text-ink">◆</span> : null}
                        {text}
                        {wrong ? <Icon name="cross" size={14} className="ml-1 inline text-witty-red-ink" /> : null}
                        {solved ? <span className="ml-1 border-2 border-ink bg-paper px-1 font-pixel text-xs uppercase text-forest">≠ glossary</span> : null}
                      </button>
                    );
                  })}
                </div>
                {hint && !state.revealing ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-forest" role="status">
                    <Icon name="search" size={16} /> Hint: compare each ◆ term with the glossary.
                  </p>
                ) : null}
              </div>
            </div>

            {state.revealing ? (
              <div className="flex flex-col items-start gap-3 border-2 border-ink bg-mint p-4 shadow-pixel sm:flex-row sm:items-center" role="status">
                <Icon name="check" size={28} className="shrink-0 text-forest" />
                <p className="flex-1">{round.explanation}</p>
                <Button size="md" onClick={() => dispatch({ type: "continue" })} iconAfter="arrow" autoFocus>
                  Next case
                </Button>
              </div>
            ) : null}
          </motion.article>
        </AnimatePresence>
      ) : (
        <p className="mt-8 text-center font-pixel text-xl uppercase">All cases closed!</p>
      )}
    </MissionShell>
  );
}

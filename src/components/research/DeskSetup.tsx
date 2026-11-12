"use client";

import { useMemo, useState } from "react";
import { researchContent } from "@/config";
import { shuffleWithPinned } from "@/lib/game/rng";
import type { SingleAnswer } from "@/lib/research/schema";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { InterludeFrame, OptionCard } from "./InterludeFrame";

/**
 * Desk set-up: the nameplate (work function) and the inbox lamp (frequency).
 * Both are cosmetic in-game: they never change difficulty or score.
 */
export function DeskSetup({
  seed,
  onDone,
}: {
  seed: number;
  onDone: (a: { workFunction: SingleAnswer; frequency: SingleAnswer }) => void;
}) {
  const wf = researchContent.questions.workFunction;
  const freq = researchContent.questions.frequency;
  const options = useMemo(() => shuffleWithPinned(wf.options, seed, (o) => !!o.pinned), [wf.options, seed]);
  const [role, setRole] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const freqIndex = frequency ? freq.options.findIndex((o) => o.id === frequency) : -1;
  // Lamp glow is purely decorative: brighter for more frequent translation.
  const glow = freqIndex < 0 ? 0 : (freq.options.length - freqIndex) / freq.options.length;

  const submit = () =>
    onDone({
      workFunction: role ? { status: "answered", value: role } : { status: "skipped" },
      frequency: frequency ? { status: "answered", value: frequency } : { status: "skipped" },
    });

  return (
    <InterludeFrame
      testId="interlude-desk"
      title="Set up your rescue desk"
      subtitle="Before the shift starts, tell wiTTy a little about your real work."
      onSkip={() => onDone({ workFunction: { status: "skipped" }, frequency: { status: "skipped" } })}
      footer={
        <Button onClick={submit} iconAfter="arrow" disabled={!role && !frequency} data-testid="desk-continue">
          Start my shift
        </Button>
      }
    >
      <fieldset className="mb-5">
        <legend className="mb-2 font-pixel text-sm uppercase sm:text-base">{wf.prompt}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={wf.prompt}>
          {options.map((o) => (
            <OptionCard
              key={o.id}
              role="radio"
              label={o.label}
              selected={role === o.id}
              onClick={() => setRole(role === o.id ? null : o.id)}
              testId={`wf-${o.id}`}
              icon={
                <span className="flex h-9 w-12 items-center justify-center border-2 border-ink bg-butter font-pixel text-[0.6rem] uppercase">
                  Desk
                </span>
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-pixel text-sm uppercase sm:text-base">{freq.prompt}</legend>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div
            aria-hidden
            className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center border-2 border-ink text-ink transition"
            style={{ backgroundColor: `rgb(255 232 133 / ${0.15 + glow * 0.85})`, boxShadow: `${2 + glow * 6}px ${2 + glow * 6}px 0 #2c2523` }}
          >
            <Icon name="sparkle" size={28} />
          </div>
          <div className="checker grid flex-1 grid-cols-5 gap-1.5 border-2 border-ink p-1.5" role="radiogroup" aria-label={freq.prompt}>
            {freq.options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={frequency === o.id}
                onClick={() => setFrequency(frequency === o.id ? null : o.id)}
                className={`min-h-14 border-2 px-1 text-sm font-bold sm:text-base ${
                  frequency === o.id ? "border-ink bg-mint text-ink shadow-pixel-sm" : "border-transparent text-ink hover:border-ink hover:bg-paper"
                }`}
                data-testid={`freq-${o.id}`}
              >
                {frequency === o.id ? <Icon name="check" size={14} className="mx-auto mb-0.5" /> : null}
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </fieldset>
    </InterludeFrame>
  );
}

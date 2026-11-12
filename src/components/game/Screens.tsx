"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { Witty } from "@/components/mascot/Witty";
import { Button, Kbd } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PixelProgress } from "@/components/ui/PixelProgress";
import { PixelBadge, RetroWindow } from "@/components/ui/RetroWindow";
import { brandAssets } from "@/config/brand";
import type { RunSummary } from "@/lib/game/badges";
import { MISSION_TITLES, type MissionId, type MissionResult } from "@/lib/game/types";
import { useGame } from "./GameContext";
import { useAnimatedNumber, useKeys } from "./hooks";
import { Confetti } from "./Confetti";
import { StageMap } from "./StageMap";

const GREETINGS = ["Hello", "你好", "Selamat datang", "வணக்கம்", "Terima kasih", "谢谢", "நன்றி", "Thank you"];

function Brand({ compact = false }: { compact?: boolean }) {
  const logo = brandAssets.sgtLogoOnLight;
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local brand logo
        <img src={logo} alt="SG Translate 2.0" height={compact ? 28 : 40} className={compact ? "h-7" : "h-10"} />
      ) : (
        <span
          className={`border-2 border-dashed border-ink bg-paper px-2 py-1 font-pixel uppercase text-ink ${compact ? "text-xs" : "text-sm"}`}
        >
          SG Translate 2.0
        </span>
      )}
    </div>
  );
}

function SoundToggle() {
  const { muted, toggleMute } = useGame();
  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={!muted}
      className="retro-press flex min-h-11 items-center gap-2 border-2 border-ink bg-paper px-3 font-pixel text-xs uppercase text-ink shadow-pixel-sm"
    >
      <Icon name={muted ? "mute" : "sound"} size={18} />
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function AttractScreen({ onWake }: { onWake: () => void }) {
  const { event } = useGame();
  useKeys((e) => {
    if (e.key === "Enter" || e.key === " ") onWake();
  });
  return (
    <button
      type="button"
      onClick={onWake}
      className="desk-bg relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-6 text-center"
      data-testid="attract"
      aria-label="Start wiTTy's Translation Rescue"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="animate-drift absolute inset-x-0 top-0 flex flex-col items-center gap-16 pt-16">
          {[...GREETINGS, ...GREETINGS, ...GREETINGS].map((g, i) => (
            <span
              key={i}
              className={`border-2 border-ink px-4 py-2 text-xl text-ink shadow-pixel ${["bg-paper", "bg-butter", "bg-mint", "bg-coral"][i % 4]}`}
              style={{ transform: `translateX(${((i * 37) % 70) - 35}vw)` }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      <RetroWindow stack title="WITTY_RESCUE.EXE" icon="sparkle" className="relative z-10 w-full max-w-3xl" bodyClassName="flex flex-col items-center px-6 py-8 sm:px-10">
        <Brand />
        <Witty pose="wave" size={200} className="my-6" />
        <h1 className="font-pixel text-4xl font-bold uppercase leading-[1.1] text-ink sm:text-6xl">
          wiTTy&apos;s Translation Rescue
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-muted sm:text-2xl">3 translation missions. 2 minutes. Can you save the day?</p>
        <span className="animate-pulse-ring mt-10 inline-flex items-center gap-3 border-2 border-ink bg-witty-red px-10 py-5 font-pixel text-2xl font-bold uppercase text-white">
          <Icon name="arrow" size={28} /> <span className="animate-blink">Press to play</span>
        </span>
        <p className="mt-8 text-sm text-muted">{event.name}</p>
      </RetroWindow>
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const { event, mode } = useGame();
  useKeys((e) => {
    if (e.key === "Enter") onStart();
  });
  return (
    <section className="desk-bg flex min-h-dvh flex-col" data-testid="title">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Brand compact />
          <SoundToggle />
        </div>
        <PixelProgress completed={0} />
        <RetroWindow stack title="WITTY_RESCUE.EXE" icon="sparkle" bodyClassName="flex flex-col items-center gap-4 p-4 text-center sm:flex-row sm:p-6 sm:text-left">
          <Witty pose="idle" size={mode === "kiosk" ? 160 : 120} />
          <div>
            <p className="font-pixel text-xs uppercase text-forest sm:text-sm">wiTTy needs your help</p>
            <h1 className="mt-1 font-pixel text-3xl font-bold uppercase leading-tight text-ink sm:text-5xl">Translation Rescue</h1>
            <p className="mt-2 max-w-xl text-lg text-muted">
              Government messages need to reach everyone, fast and consistently. Clear three missions in about two minutes.
            </p>
          </div>
        </RetroWindow>
        <StageMap stage={0} completed={0} wittyAt={-1} onEnter={onStart} />
        <div className="mt-auto flex flex-col items-center gap-3 pt-2">
          <Button size="xl" onClick={onStart} iconAfter="arrow" data-testid="start" autoFocus>
            Start the rescue
          </Button>
          <p className="max-w-xl text-center text-sm text-muted">
            <Icon name="lock" size={14} className="mr-1 inline" />
            Between missions, wiTTy asks a few quick questions about your real work. Your answers are anonymous: no
            names, emails or free text. Skip any step.
          </p>
          <p className="text-xs text-muted">{event.shortName} · All game scenarios are fictional.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const introCopy: Record<MissionId, { goal: string; how: ReactNode; icon: IconName }> = {
  rush: {
    icon: "bolt",
    goal: "Requests are piling up! Send each one to the right SG Translate 2.0 tool before it times out.",
    how: (
      <>
        Drag a card onto a tool, or tap a card then a tool. Keyboard: <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd>.
      </>
    ),
  },
  detective: {
    icon: "search",
    goal: "A notice uses a government term inconsistently. Find the one occurrence that doesn't match the approved glossary.",
    how: <>Compare shapes, not meanings. You don&apos;t need to read the language. Tap the odd term out.</>,
  },
  launch: {
    icon: "rocket",
    goal: "An agency announcement must go live in three languages. Run SGT, send drafts for human review, fix issues, then publish.",
    how: <>Reviewers are limited, so plan your moves. Publishing without review will cost you time.</>,
  },
};

export function MissionIntro({ mission, index, onStart }: { mission: MissionId; index: number; onStart: () => void }) {
  const c = introCopy[mission];
  useKeys((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStart();
    }
  });
  return (
    <section className="desk-bg flex min-h-dvh flex-col items-center justify-center px-4 py-6" data-testid={`intro-${mission}`}>
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <PixelProgress completed={index} />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <RetroWindow
            stack
            title={`STAGE_0${index + 1}.EXE`}
            icon={c.icon}
            variant="coral"
            bodyClassName="flex flex-col items-center gap-4 p-4 text-center sm:p-8"
          >
            <PixelBadge tone="butter">Mission {index + 1} of 3</PixelBadge>
            <StageMap stage={index} completed={index} wittyAt={index} hopFrom={index - 1} onEnter={onStart} />
            <h2 className="font-pixel text-3xl font-bold uppercase text-ink sm:text-4xl">{MISSION_TITLES[mission]}</h2>
            <p className="text-lg">{c.goal}</p>
            <p className="text-sm text-muted">{c.how}</p>
            <Button size="xl" onClick={onStart} iconAfter="arrow" autoFocus data-testid="mission-go">
              Play
            </Button>
          </RetroWindow>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const takeaway: Record<MissionId, string> = {
  rush: "Different jobs, different tools: SG Translate Together for everyday documents, Polyglot for websites, and the SGT 2.0 API for apps and systems.",
  detective: "Consistent terms help residents understand and trust government messages. Glossaries help keep terms consistent.",
  launch: "Fast AI drafts plus human review: AI translations may need review before publication.",
};

function statLine(r: MissionResult): string {
  switch (r.mission) {
    case "rush":
      return `${r.stats.correct ?? 0} routed correctly · ${(r.stats.wrong ?? 0) + (r.stats.expired ?? 0)} missed`;
    case "detective":
      return `${r.stats.solved ?? 0} of ${r.stats.rounds ?? 0} cases solved`;
    case "launch":
      return `${r.stats.published ?? 0} of ${r.stats.lanes ?? 0} languages published${
        (r.stats.unreviewedPublishAttempts ?? 0) > 0 ? ` · ${r.stats.unreviewedPublishAttempts} unreviewed publish attempt(s)` : ""
      }`;
  }
}

export function MissionResultCard({ result, onNext }: { result: MissionResult; onNext: () => void }) {
  const { mode } = useGame();
  const score = useAnimatedNumber(result.score, 900);
  useKeys((e) => {
    if (e.key === "Enter") onNext();
  });
  useEffect(() => {
    if (mode !== "kiosk") return;
    const id = setTimeout(onNext, 9000);
    return () => clearTimeout(id);
  }, [mode, onNext]);
  return (
    <section className="desk-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-6" data-testid={`result-${result.mission}`}>
      {result.success ? <Confetti count={40} /> : null}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-xl">
        <RetroWindow
          stack
          title="RESULT.LOG"
          icon={result.success ? "star" : "replay"}
          variant={result.success ? "mint" : "coral"}
          bodyClassName="flex flex-col items-center gap-3 p-6 text-center sm:p-8"
        >
          <Witty pose={result.success ? "celebrate" : "thinking"} size={110} />
          <p
            className={`inline-flex items-center gap-2 border-2 border-ink px-4 py-1.5 font-pixel text-sm uppercase text-ink shadow-pixel-sm ${
              result.success ? "bg-mint" : "border-dashed bg-paper"
            }`}
            data-testid="mission-outcome"
          >
            <Icon name={result.success ? "star" : "replay"} size={16} />
            {result.success ? "Mission complete" : "Mission over: nice try"}
          </p>
          <h2 className="font-pixel text-2xl font-bold uppercase sm:text-3xl">{MISSION_TITLES[result.mission]}</h2>
          <p className="checker border-2 border-ink px-5 py-2 font-pixel text-5xl tabular-nums">{score.toLocaleString("en-SG")}</p>
          <p className="text-muted">{statLine(result)}</p>
          <p className="border-2 border-dashed border-ink bg-paper px-4 py-3 text-sm">{takeaway[result.mission]}</p>
          <Button variant="secondary" onClick={onNext} iconAfter="arrow" autoFocus data-testid="mission-next">
            OK
          </Button>
        </RetroWindow>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Medal({ label, tier }: { label: string; tier: RunSummary["tier"] }) {
  const frame = tier === "master" ? "bg-butter" : tier === "specialist" ? "bg-mint" : "bg-coral";
  return (
    <div className="flex flex-col items-center gap-3" data-testid="tier-badge" data-tier={tier}>
      <div className={`animate-pop flex h-36 w-36 items-center justify-center border-2 border-ink p-2 shadow-pixel-lg ${frame}`}>
        <div className="checker flex h-full w-full flex-col items-center justify-center border-2 border-ink">
          <Icon name="star" size={44} className="text-witty-red" strokeWidth={2.6} />
          <span className="mt-1 font-pixel text-sm text-ink">
            {tier === "master" ? "★★★" : tier === "specialist" ? "★★" : "★"}
          </span>
        </div>
      </div>
      <p className="font-pixel text-2xl font-bold uppercase">{label}</p>
    </div>
  );
}

export function ResultsScreen({
  summary,
  onReplay,
  onInterest,
  onFinish,
}: {
  summary: RunSummary;
  onReplay: () => void;
  onInterest: () => void;
  onFinish: () => void;
}) {
  const total = useAnimatedNumber(summary.totalScore, 1400);
  return (
    <section className="desk-bg relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-6" data-testid="results">
      <Confetti count={90} />
      <div className="relative z-10 flex w-full max-w-3xl flex-col gap-5">
        <PixelProgress completed={3} />
        <RetroWindow stack title="RESCUE_COMPLETE.EXE" icon="star" variant="mint" bodyClassName="flex flex-col items-center gap-5 p-5 text-center sm:p-8">
          <div className="flex items-end gap-4">
            <Witty pose="cheer" size={120} />
            <div className="text-left">
              <p className="font-pixel text-sm uppercase text-forest">Rescue complete</p>
              <p className="font-pixel text-5xl tabular-nums sm:text-6xl" data-testid="final-score">
                {total.toLocaleString("en-SG")}
              </p>
            </div>
          </div>
          <Medal label={summary.tierLabel} tier={summary.tier} />
          {summary.badges.length > 0 ? (
            <ul className="flex flex-wrap justify-center gap-3" aria-label="Badges earned">
              {summary.badges.map((b, i) => (
                <motion.li
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
                  className="flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 text-left shadow-pixel-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-butter">
                    <Icon name="star" size={18} />
                  </span>
                  <span>
                    <span className="block font-pixel text-xs uppercase">{b.title}</span>
                    <span className="block text-xs text-muted">{b.description}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No mission badges this time. Play again to earn some!</p>
          )}
          <div className="checker w-full border-2 border-ink p-4 text-left text-sm">
            <p className="mb-1 font-pixel text-xs uppercase">What you just practised</p>
            <ul className="list-inside list-disc space-y-1 text-ink">
              <li>Picking the right SG Translate 2.0 tool: web portal, website translation or API.</li>
              <li>Keeping government terms consistent across a message.</li>
              <li>Pairing fast AI drafts with human review before publishing.</li>
            </ul>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button onClick={onInterest} icon="gift" data-testid="cta-interest">
              See how SGT 2.0 fits your work
            </Button>
            <Button variant="secondary" onClick={onReplay} icon="replay" data-testid="replay">
              Play again
            </Button>
            <Button variant="ghost" onClick={onFinish} data-testid="finish">
              Finish
            </Button>
          </div>
          <p className="text-xs text-muted">Game scenarios and translations are fictional and illustrative.</p>
        </RetroWindow>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function InterestScreen({
  onExpressed,
  onDeclined,
  onLinkOpened,
  onQrShown,
  onDone,
}: {
  onExpressed: () => void;
  onDeclined: () => void;
  onLinkOpened: () => void;
  onQrShown: () => void;
  onDone: () => void;
}) {
  const { event, mode } = useGame();
  const [stage, setStage] = useState<"ask" | "link">("ask");
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== "link" || !event.formsgUrl) return;
    let cancelled = false;
    QRCode.toDataURL(event.formsgUrl, { margin: 1, width: 360, color: { dark: "#2c2523", light: "#ffffff" } })
      .then((url) => {
        if (cancelled) return;
        setQr(url);
        onQrShown();
      })
      .catch(() => setQr(null));
    return () => {
      cancelled = true;
    };
    // onQrShown is recorded once per showing of the QR
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, event.formsgUrl]);

  return (
    <section className="desk-bg flex min-h-dvh items-center justify-center px-4 py-6" data-testid="interest">
      <RetroWindow
        stack
        title={stage === "ask" ? "MESSAGE.TXT" : "REGISTER.EXE"}
        icon="gift"
        className="w-full max-w-xl"
        bodyClassName="flex flex-col items-center gap-4 p-6 text-center sm:p-8"
      >
        <Witty pose="wave" size={100} />
        {stage === "ask" ? (
          <>
            <h2 className="font-pixel text-2xl font-bold uppercase sm:text-3xl">Want the SGT 2.0 team to share more?</h2>
            <p className="text-muted">
              Only if it&apos;s relevant to your work. Playing the game doesn&apos;t sign you up for anything.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  onExpressed();
                  setStage("link");
                }}
                icon="check"
                data-testid="interest-yes"
              >
                Yes, show me how
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onDeclined();
                  onDone();
                }}
                data-testid="interest-no"
              >
                Not now
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-pixel text-2xl font-bold uppercase sm:text-3xl">Register your interest</h2>
            {event.formsgUrl ? (
              <>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                  <img src={qr} alt="QR code linking to the SG Translate 2.0 registration form on FormSG" width={240} height={240} className="border-2 border-ink bg-white p-2 shadow-pixel" />
                ) : null}
                <p className="text-muted">
                  {mode === "kiosk" ? "Scan with your phone to open the official FormSG registration." : "Open the official FormSG registration form."}
                </p>
                {mode === "mobile" ? (
                  <a
                    href={event.formsgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onLinkOpened}
                    className="retro-press inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-witty-red px-6 font-pixel text-[1.2rem] font-bold uppercase text-white shadow-pixel"
                    data-testid="formsg-link"
                  >
                    Open FormSG <Icon name="arrow" size={20} />
                  </a>
                ) : null}
              </>
            ) : (
              <p className="checker border-2 border-dashed border-ink px-4 py-6 text-muted" data-testid="formsg-placeholder">
                Registration link to be confirmed. Please speak to our booth staff.
              </p>
            )}
            <p className="text-xs text-muted">Registration happens on FormSG. This game never asks for your name or email.</p>
            <Button variant="secondary" onClick={onDone} data-testid="interest-done">
              Done
            </Button>
          </>
        )}
      </RetroWindow>
    </section>
  );
}

export function ThanksScreen({ onReplay, onHome }: { onReplay: () => void; onHome: () => void }) {
  const { mode } = useGame();
  useEffect(() => {
    if (mode !== "kiosk") return;
    const id = setTimeout(onHome, 10_000);
    return () => clearTimeout(id);
  }, [mode, onHome]);
  return (
    <section className="desk-bg flex min-h-dvh items-center justify-center px-4 py-6" data-testid="thanks">
      <RetroWindow stack title="THANKS.TXT" icon="sparkle" variant="mint" className="w-full max-w-xl" bodyClassName="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
        <Witty pose="wave" size={160} />
        <h2 className="font-pixel text-3xl font-bold uppercase sm:text-4xl">Thanks for playing!</h2>
        <p className="max-w-lg text-lg text-muted">
          {mode === "kiosk"
            ? "Chat with our team to see SG Translate 2.0 in action."
            : "Find out more about SG Translate 2.0 from the SGT 2.0 team."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={onReplay} icon="replay">
            Play again
          </Button>
          {mode === "kiosk" ? (
            <Button variant="ghost" onClick={onHome} data-testid="thanks-home">
              Done
            </Button>
          ) : null}
        </div>
      </RetroWindow>
    </section>
  );
}

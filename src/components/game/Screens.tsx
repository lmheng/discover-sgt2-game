"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { Witty } from "@/components/mascot/Witty";
import { Button, Kbd } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { brandAssets } from "@/config/brand";
import type { RunSummary } from "@/lib/game/badges";
import { MISSION_TITLES, type MissionId, type MissionResult } from "@/lib/game/types";
import { useGame } from "./GameContext";
import { useAnimatedNumber, useKeys } from "./hooks";
import { Confetti } from "./Confetti";

const GREETINGS = ["Hello", "你好", "Selamat datang", "வணக்கம்", "Terima kasih", "谢谢", "நன்றி", "Thank you"];

function Brand({ compact = false }: { compact?: boolean }) {
  const logo = brandAssets.sgtLogoOnDark;
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local brand logo
        <img src={logo} alt="SG Translate 2.0" height={compact ? 28 : 40} className={compact ? "h-7" : "h-10"} />
      ) : (
        <span className={`rounded-lg border border-dashed border-white/40 px-2 py-1 font-bold tracking-wide ${compact ? "text-xs" : "text-sm"}`}>
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
      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-white/10 hover:text-ink"
    >
      <Icon name={muted ? "mute" : "sound"} size={20} />
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
      className="arcade-bg relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-6 text-center"
      data-testid="attract"
      aria-label="Start wiTTy's Translation Rescue"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="animate-drift absolute inset-x-0 top-0 flex flex-col items-center gap-16 pt-16">
          {[...GREETINGS, ...GREETINGS, ...GREETINGS].map((g, i) => (
            <span
              key={i}
              className="rounded-2xl rounded-bl-sm border border-white/20 bg-white/10 px-4 py-2 text-xl"
              style={{ transform: `translateX(${((i * 37) % 70) - 35}vw)` }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <Brand />
        <Witty pose="wave" size={220} className="my-6" />
        <h1 className="bg-gradient-to-r from-blue-300 via-white to-purple-200 bg-clip-text text-5xl font-black leading-[1.05] tracking-tight text-transparent sm:text-7xl">
          wiTTy&apos;s Translation Rescue
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-muted sm:text-2xl">3 translation missions. 2 minutes. Can you save the day?</p>
        <span className="animate-pulse-ring mt-10 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-10 py-5 text-2xl font-black shadow-2xl">
          <Icon name="arrow" size={28} /> Tap to play
        </span>
        <p className="mt-8 text-sm text-muted">{event.name}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */

const missionCards: { id: MissionId; icon: IconName; blurb: string }[] = [
  { id: "rush", icon: "bolt", blurb: "Route requests to the right SGT 2.0 tool." },
  { id: "detective", icon: "search", blurb: "Spot the inconsistent term. No other language needed." },
  { id: "launch", icon: "rocket", blurb: "Translate, review and publish before the countdown ends." },
];

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const { event, mode } = useGame();
  useKeys((e) => {
    if (e.key === "Enter") onStart();
  });
  return (
    <section className="arcade-bg flex min-h-dvh flex-col" data-testid="title">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <Brand compact />
          <SoundToggle />
        </div>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Witty pose="idle" size={mode === "kiosk" ? 170 : 130} />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">wiTTy needs your help</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">Translation Rescue</h1>
            <p className="mt-2 max-w-xl text-lg text-muted">
              Government messages need to reach everyone, fast and consistently. Clear three missions in about two minutes.
            </p>
          </div>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {missionCards.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="glass flex gap-3 rounded-2xl p-4 sm:flex-col"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                <Icon name={m.icon} size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted">Mission {i + 1}</p>
                <p className="text-lg font-bold">{MISSION_TITLES[m.id]}</p>
                <p className="text-sm text-muted">{m.blurb}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <div className="mt-auto flex flex-col items-center gap-3">
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
    <section className="arcade-bg flex min-h-dvh items-center justify-center px-4" data-testid={`intro-${mission}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="glass flex w-full max-w-2xl flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-10"
      >
        <span className="text-sm font-black uppercase tracking-[0.3em] text-blue-300">Mission {index + 1} of 3</span>
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl">
          <Icon name={c.icon} size={40} />
        </span>
        <h2 className="text-4xl font-black sm:text-5xl">{MISSION_TITLES[mission]}</h2>
        <p className="text-lg">{c.goal}</p>
        <p className="text-sm text-muted">{c.how}</p>
        <Button size="xl" onClick={onStart} iconAfter="arrow" autoFocus data-testid="mission-go">
          Go!
        </Button>
      </motion.div>
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
    <section className="arcade-bg flex min-h-dvh items-center justify-center px-4" data-testid={`result-${result.mission}`}>
      {result.success ? <Confetti count={40} /> : null}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl p-6 text-center sm:p-8"
      >
        <Witty pose={result.success ? "celebrate" : "thinking"} size={110} />
        <p
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest ${
            result.success ? "bg-blue-500 text-white" : "border-2 border-dashed border-white/40 text-ink"
          }`}
          data-testid="mission-outcome"
        >
          <Icon name={result.success ? "star" : "replay"} size={16} />
          {result.success ? "Mission complete" : "Mission over: nice try"}
        </p>
        <h2 className="text-3xl font-black">{MISSION_TITLES[result.mission]}</h2>
        <p className="font-mono text-5xl font-black tabular-nums">{score.toLocaleString("en-SG")}</p>
        <p className="text-muted">{statLine(result)}</p>
        <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm">{takeaway[result.mission]}</p>
        <Button onClick={onNext} iconAfter="arrow" autoFocus data-testid="mission-next">
          Continue
        </Button>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Medal({ label, tier }: { label: string; tier: RunSummary["tier"] }) {
  const ring = tier === "master" ? "from-purple-400 via-blue-300 to-purple-500" : tier === "specialist" ? "from-blue-400 to-purple-400" : "from-blue-500 to-navy-600";
  return (
    <div className="flex flex-col items-center gap-2" data-testid="tier-badge" data-tier={tier}>
      <div className={`animate-pop flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br p-1.5 shadow-2xl shadow-purple-900/60 ${ring}`}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-navy-900">
          <Icon name="star" size={40} className="text-purple-200" />
          <span className="mt-1 text-xs font-black uppercase tracking-widest text-blue-300">
            {tier === "master" ? "★★★" : tier === "specialist" ? "★★" : "★"}
          </span>
        </div>
      </div>
      <p className="text-2xl font-black">{label}</p>
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
    <section className="arcade-bg relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-6" data-testid="results">
      <Confetti count={90} />
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <div className="flex items-end gap-4">
          <Witty pose="cheer" size={120} />
          <div className="text-left">
            <p className="text-sm font-black uppercase tracking-widest text-blue-300">Rescue complete</p>
            <p className="font-mono text-6xl font-black tabular-nums" data-testid="final-score">
              {total.toLocaleString("en-SG")}
            </p>
          </div>
        </div>
        <Medal label={summary.tierLabel} tier={summary.tier} />
        {summary.badges.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Badges earned">
            {summary.badges.map((b, i) => (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
                className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-left"
              >
                <Icon name="star" size={20} className="text-purple-200" />
                <span>
                  <span className="block text-sm font-bold">{b.title}</span>
                  <span className="block text-xs text-muted">{b.description}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No mission badges this time. Play again to earn some!</p>
        )}
        <div className="glass w-full rounded-2xl p-4 text-left text-sm">
          <p className="mb-1 font-bold">What you just practised</p>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>Picking the right SG Translate 2.0 tool: web portal, website translation or API.</li>
            <li>Keeping government terms consistent across a message.</li>
            <li>Pairing fast AI drafts with human review before publishing.</li>
          </ul>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
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
    QRCode.toDataURL(event.formsgUrl, { margin: 1, width: 360, color: { dark: "#060d26", light: "#ffffff" } })
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
    <section className="arcade-bg flex min-h-dvh items-center justify-center px-4 py-6" data-testid="interest">
      <div className="glass flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-8">
        <Witty pose="wave" size={100} />
        {stage === "ask" ? (
          <>
            <h2 className="text-3xl font-black">Want the SGT 2.0 team to share more?</h2>
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
                variant="secondary"
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
            <h2 className="text-3xl font-black">Register your interest</h2>
            {event.formsgUrl ? (
              <>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                  <img src={qr} alt="QR code linking to the SG Translate 2.0 registration form on FormSG" width={240} height={240} className="rounded-2xl bg-white p-2" />
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
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 font-bold text-navy-950"
                    data-testid="formsg-link"
                  >
                    Open FormSG <Icon name="arrow" size={20} />
                  </a>
                ) : null}
              </>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-white/30 px-4 py-6 text-muted" data-testid="formsg-placeholder">
                Registration link to be confirmed. Please speak to our booth staff.
              </p>
            )}
            <p className="text-xs text-muted">Registration happens on FormSG. This game never asks for your name or email.</p>
            <Button variant="secondary" onClick={onDone} data-testid="interest-done">
              Done
            </Button>
          </>
        )}
      </div>
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
    <section className="arcade-bg flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center" data-testid="thanks">
      <Witty pose="wave" size={180} />
      <h2 className="text-4xl font-black sm:text-5xl">Thanks for playing!</h2>
      <p className="max-w-lg text-lg text-muted">
        {mode === "kiosk"
          ? "Chat with our team to see SG Translate 2.0 in action."
          : "Find out more about SG Translate 2.0 from the SGT 2.0 team."}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onReplay} icon="replay">
          Play again
        </Button>
        {mode === "kiosk" ? (
          <Button variant="ghost" onClick={onHome} data-testid="thanks-home">
            Done
          </Button>
        ) : null}
      </div>
    </section>
  );
}

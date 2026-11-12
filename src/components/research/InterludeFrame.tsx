"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Witty } from "@/components/mascot/Witty";
import { Icon } from "@/components/ui/Icon";
import { PixelBadge, RetroWindow } from "@/components/ui/RetroWindow";

/**
 * Visual frame for "Real Mission" research interludes. It uses a distinct
 * striped/dotted backdrop, a striped title bar and an explicit "not scored" label,
 * with no timer, score or combo, so players can tell it apart from scored gameplay.
 */
export function InterludeFrame({
  title,
  subtitle,
  onSkip,
  children,
  footer,
  testId,
}: {
  title: string;
  subtitle: string;
  onSkip: () => void;
  children: ReactNode;
  footer?: ReactNode;
  testId: string;
}) {
  return (
    <section className="interlude-bg flex min-h-full w-full flex-col" data-testid={testId} aria-labelledby={`${testId}-title`}>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        {/* Skip stays the first focusable element (window controls are decorative). */}
        <div className="flex items-center justify-between gap-3">
          <PixelBadge tone="paper" className="border-dashed">
            <Icon name="user" size={14} /> Real mission · not scored
          </PixelBadge>
          <button
            type="button"
            onClick={onSkip}
            className="retro-press min-h-11 border-2 border-ink bg-paper px-4 font-pixel text-sm uppercase text-ink shadow-pixel-sm"
            data-testid="interlude-skip"
          >
            Skip
          </button>
        </div>
        <RetroWindow title="REAL_MISSION.TXT" icon="user" variant="interlude" className="flex flex-1 flex-col" bodyClassName="flex flex-col gap-4 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <Witty pose="thinking" size={72} />
            <div>
              <h2 id={`${testId}-title`} className="font-pixel text-xl font-bold uppercase leading-tight sm:text-2xl">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>
            </div>
          </motion.div>
          <div className="flex flex-1 flex-col">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-3">{footer}</div> : null}
        </RetroWindow>
        <p className="text-center text-xs text-muted">
          Anonymous. No names, emails or free text. Your answers don&apos;t affect your score.
        </p>
      </div>
    </section>
  );
}

export function OptionCard({
  label,
  selected,
  onClick,
  icon,
  testId,
  role = "checkbox",
  className = "",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  testId?: string;
  role?: "checkbox" | "radio";
  className?: string;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      data-testid={testId}
      className={`retro-press relative flex min-h-16 items-center gap-3 border-2 border-ink px-4 py-3 text-left font-semibold text-ink ${
        selected ? "bg-mint shadow-pixel" : "bg-paper shadow-pixel-sm"
      } ${className}`}
    >
      {icon}
      <span className="flex-1 leading-snug">{label}</span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-ink ${selected ? "bg-forest text-paper" : "bg-paper"}`}
        aria-hidden
      >
        {selected ? <Icon name="check" size={16} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

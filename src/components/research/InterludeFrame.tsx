"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Witty } from "@/components/mascot/Witty";
import { Icon } from "@/components/ui/Icon";

/**
 * Visual frame for "Real Mission" research interludes. It uses a distinct
 * striped pattern and an explicit "not scored" label, with no timer, score or
 * combo, so players can tell it apart from scored gameplay.
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
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-purple-300 bg-purple-500/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-200">
            <Icon name="user" size={14} /> Real mission · not scored
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
            data-testid="interlude-skip"
          >
            Skip
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4"
        >
          <Witty pose="thinking" size={72} />
          <div>
            <h2 id={`${testId}-title`} className="text-2xl font-black leading-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>
          </div>
        </motion.div>
        <div className="flex flex-1 flex-col">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-3">{footer}</div> : null}
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
      className={`relative flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${
        selected
          ? "border-purple-300 bg-gradient-to-br from-purple-500/60 to-blue-500/50 shadow-lg shadow-purple-900/40"
          : "border-white/20 bg-navy-800/80 hover:border-blue-300/70"
      } ${className}`}
    >
      {icon}
      <span className="flex-1 leading-snug">{label}</span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-white bg-white text-purple-600" : "border-white/30"
        }`}
        aria-hidden
      >
        {selected ? <Icon name="check" size={16} /> : null}
      </span>
    </button>
  );
}

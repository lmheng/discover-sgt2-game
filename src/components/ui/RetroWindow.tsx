import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type RetroVariant = "default" | "butter" | "coral" | "mint" | "interlude" | "paper";

const barFill: Record<RetroVariant, string> = {
  default: "bg-butter",
  butter: "bg-butter",
  coral: "bg-coral",
  mint: "bg-mint",
  interlude: "grip",
  paper: "bg-checker",
};

/** The red [X] close glyph. Icon-only, so the red fill never carries small text. */
function CloseGlyph() {
  return (
    <span className="flex h-6 w-6 items-center justify-center border-2 border-ink bg-witty-red text-white">
      <Icon name="cross" size={14} strokeWidth={3} strokeLinecap="square" />
    </span>
  );
}

/** Decorative [-] and [□] controls: never focusable, hidden from assistive tech. */
function WindowControls({ onClose, closeLabel }: { onClose?: () => void; closeLabel?: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span aria-hidden className="flex h-6 w-6 items-end justify-center border-2 border-ink bg-paper pb-1">
        <span className="h-0.5 w-2.5 bg-ink" />
      </span>
      <span aria-hidden className="hidden h-6 w-6 items-center justify-center border-2 border-ink bg-paper sm:flex">
        <span className="h-2.5 w-2.5 border-2 border-ink" />
      </span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label={closeLabel ?? "Close"} className="focus-ring">
          <CloseGlyph />
        </button>
      ) : (
        <span aria-hidden>
          <CloseGlyph />
        </span>
      )}
    </div>
  );
}

/** Title bar on its own, for cards that manage their own body (e.g. folders, drag cards). */
export function TitleBar({
  title,
  icon,
  variant = "default",
  controls = true,
  onClose,
  closeLabel,
  className = "",
  as: Tag = "div",
  id,
}: {
  title: ReactNode;
  icon?: IconName;
  variant?: RetroVariant;
  controls?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  as?: "div" | "h2" | "h3";
  id?: string;
}) {
  return (
    <div className={`flex items-center gap-2 border-b-2 border-ink px-2 py-1.5 ${barFill[variant]} ${className}`}>
      <Tag id={id} className="flex min-w-0 flex-1 items-center gap-1.5 font-pixel text-xs uppercase leading-none tracking-wide text-ink sm:text-sm">
        {icon ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink bg-paper">
            <Icon name={icon} size={12} strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />
          </span>
        ) : null}
        <span className="truncate">{title}</span>
      </Tag>
      {controls ? <WindowControls onClose={onClose} closeLabel={closeLabel} /> : null}
    </div>
  );
}

/**
 * Retro desktop-OS window: title bar with pixel icon + uppercase title, decorative
 * [-] [□] controls and a red [X]. With `stack`, one or two decorative offset windows
 * sit behind it on desktop (classic cascading windows).
 */
export function RetroWindow({
  title,
  icon,
  variant = "default",
  stack = false,
  onClose,
  closeLabel,
  className = "",
  bodyClassName = "",
  titleId,
  children,
  testId,
}: {
  title: ReactNode;
  icon?: IconName;
  variant?: RetroVariant;
  stack?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
  titleId?: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className={`relative ${className}`} data-testid={testId}>
      {stack ? (
        <>
          <div aria-hidden className="checker absolute inset-0 hidden translate-x-6 -translate-y-5 border-2 border-ink shadow-pixel md:block">
            <div className="h-9 border-b-2 border-ink bg-coral" />
          </div>
          <div aria-hidden className="absolute inset-0 hidden -translate-x-5 -translate-y-2.5 border-2 border-ink bg-paper shadow-pixel md:block">
            <div className="h-9 border-b-2 border-ink bg-mint" />
          </div>
        </>
      ) : null}
      <div className="retro-surface relative flex h-full flex-col">
        <TitleBar title={title} icon={icon} variant={variant} onClose={onClose} closeLabel={closeLabel} id={titleId} />
        <div className={`flex-1 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}

/** Small pixel badge/sticker (stage labels, "not scored", combo, etc.). */
export function PixelBadge({
  children,
  tone = "butter",
  className = "",
}: {
  children: ReactNode;
  tone?: "butter" | "mint" | "coral" | "paper" | "ink";
  className?: string;
}) {
  const tones = {
    butter: "bg-butter text-ink",
    mint: "bg-mint text-ink",
    coral: "bg-coral text-ink",
    paper: "bg-paper text-ink",
    ink: "bg-ink text-butter",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 border-ink px-2 py-1 font-pixel text-xs uppercase leading-none tracking-wide shadow-pixel-sm ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

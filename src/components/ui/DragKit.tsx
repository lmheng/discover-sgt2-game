import type { ReactNode } from "react";

/** Resting hard shadow for draggable cards (set via `style` so Motion can animate from it). */
export const CARD_SHADOW = "4px 4px 0px #2c2523";

/** Lift applied while dragging: slight scale + tilt and a deeper hard shadow. */
export const DRAG_LIFT = { scale: 1.05, rotate: 2, boxShadow: "8px 8px 0px #2c2523", zIndex: 30 } as const;

const tabTone = {
  butter: "bg-butter",
  mint: "bg-mint",
  coral: "bg-coral",
} as const;

/**
 * An open retro folder window used as a drop target (`data-drop`) and as a tap target.
 * - `hot`: a card is being dragged over it (butter fill + red dashed outline)
 * - `armed`: a card is tap-selected and ready to be sent (title bar turns coral, red light on)
 * State is always shown with shape/outline changes as well as colour.
 */
export function FolderBucket({
  drop,
  title,
  tone = "butter",
  hot = false,
  armed = false,
  disabled,
  onClick,
  testId,
  className = "",
  bodyClassName = "",
  children,
}: {
  drop: string;
  title: ReactNode;
  tone?: keyof typeof tabTone;
  hot?: boolean;
  armed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  testId?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-drop={drop}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      data-hot={hot || undefined}
      className={`relative flex flex-col border-2 border-ink text-ink transition-[transform,box-shadow] duration-100 disabled:cursor-not-allowed ${
        hot ? "-translate-y-1 shadow-pixel-lg outline-4 outline-offset-2 outline-dashed outline-witty-red" : "shadow-pixel"
      } ${className}`}
    >
      {/* Folder tab */}
      <span aria-hidden className={`absolute -top-3.5 left-2 h-3.5 w-14 border-2 border-b-0 border-ink ${tabTone[tone]}`} />
      <span
        className={`flex items-center justify-between gap-1 border-b-2 border-ink px-1.5 py-1 font-pixel text-[0.6rem] uppercase leading-none sm:text-xs ${
          armed || hot ? "bg-coral" : tabTone[tone]
        }`}
      >
        <span className="truncate">{title}</span>
        <span aria-hidden className={`h-3 w-3 shrink-0 border-2 border-ink ${armed || hot ? "bg-witty-red" : "bg-paper"}`} />
      </span>
      <span
        className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-center ${hot ? "bg-butter" : "checker"} ${bodyClassName}`}
      >
        {children}
      </span>
    </button>
  );
}

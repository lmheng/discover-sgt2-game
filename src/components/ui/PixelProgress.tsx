/**
 * Retro "LOADING..." segmented progress pill showing overall stage completion.
 * Solid blocks inside a bordered pill; the next block blinks while a stage is in progress.
 */
export function PixelProgress({
  completed,
  total = 3,
  blocks = 12,
  className = "",
  compact = false,
}: {
  completed: number;
  total?: number;
  blocks?: number;
  className?: string;
  compact?: boolean;
}) {
  const done = Math.max(0, Math.min(completed, total));
  const pct = Math.round((done / total) * 100);
  const filled = Math.round((done / total) * blocks);
  const finished = done >= total;
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="progressbar"
      aria-label={`Mission progress: ${done} of ${total} complete`}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      data-testid="stage-progress"
    >
      <span className={`shrink-0 font-pixel uppercase leading-none text-ink ${compact ? "text-[0.7rem]" : "text-xs sm:text-sm"}`} aria-hidden>
        {finished ? "Complete!" : "Loading..."}
      </span>
      <span
        aria-hidden
        className={`flex flex-1 gap-1 rounded-full border-2 border-ink bg-paper shadow-pixel-sm ${compact ? "p-[3px]" : "p-1"}`}
      >
        {Array.from({ length: blocks }, (_, i) => {
          const on = i < filled;
          const next = !finished && i === filled;
          return (
            <span
              key={i}
              className={`flex-1 ${compact ? "h-2.5" : "h-3.5"} ${i === 0 ? "rounded-l-full" : ""} ${i === blocks - 1 ? "rounded-r-full" : ""} ${
                on ? (finished ? "bg-forest" : "bg-witty-red") : next ? "animate-blink bg-coral" : "bg-checker"
              }`}
            />
          );
        })}
      </span>
      <span className={`w-11 shrink-0 text-right font-pixel leading-none tabular-nums text-ink ${compact ? "text-[0.7rem]" : "text-xs sm:text-sm"}`} aria-hidden>
        {pct}%
      </span>
    </div>
  );
}

/** Segmented block bar for timers and patience meters. */
export function BlockBar({
  fraction,
  blocks = 10,
  tone = "forest",
  className = "",
  height = "h-2.5",
}: {
  fraction: number;
  blocks?: number;
  tone?: "forest" | "red" | "mint";
  className?: string;
  height?: string;
}) {
  const filled = Math.ceil(Math.max(0, Math.min(1, fraction)) * blocks);
  const fill = tone === "red" ? "bg-witty-red" : tone === "mint" ? "bg-mint" : "bg-forest";
  return (
    <span aria-hidden className={`flex gap-[3px] border-2 border-ink bg-paper p-[2px] ${className}`}>
      {Array.from({ length: blocks }, (_, i) => (
        <span key={i} className={`flex-1 ${height} ${i < filled ? fill : "bg-checker"}`} />
      ))}
    </span>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "./GameContext";

/** The game is fully client-side (random seeds, IndexedDB, timers), so skip SSR. */
const GameApp = dynamic(() => import("./GameApp").then((m) => m.GameApp), {
  ssr: false,
  loading: () => (
    <div className="desk-bg flex min-h-dvh items-center justify-center px-4" role="status">
      <div className="retro-surface flex w-full max-w-sm flex-col gap-3 p-5 text-center">
        <p className="font-pixel text-sm uppercase text-ink">Loading wiTTy&apos;s Translation Rescue…</p>
        <span aria-hidden className="flex gap-1 rounded-full border-2 border-ink bg-paper p-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="h-3 flex-1 animate-blink bg-witty-red" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </span>
      </div>
    </div>
  ),
});

export function GameEntry({ mode }: { mode: GameMode }) {
  return <GameApp mode={mode} />;
}

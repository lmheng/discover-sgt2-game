"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "./GameContext";

/** The game is fully client-side (random seeds, IndexedDB, timers), so skip SSR. */
const GameApp = dynamic(() => import("./GameApp").then((m) => m.GameApp), {
  ssr: false,
  loading: () => (
    <div className="arcade-bg flex min-h-dvh items-center justify-center" role="status">
      <p className="animate-pulse text-lg font-semibold text-muted">Loading wiTTy&apos;s Translation Rescue…</p>
    </div>
  ),
});

export function GameEntry({ mode }: { mode: GameMode }) {
  return <GameApp mode={mode} />;
}

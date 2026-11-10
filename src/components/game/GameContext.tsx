"use client";

import { createContext, useContext } from "react";
import type { EventConfig } from "@/config/schema";

export type GameMode = "kiosk" | "mobile";

export interface GameContextValue {
  event: EventConfig;
  mode: GameMode;
  muted: boolean;
  toggleMute: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const v = useContext(GameContext);
  if (!v) throw new Error("useGame must be used inside <GameApp>");
  return v;
}

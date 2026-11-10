import type { Metadata } from "next";
import { GameEntry } from "@/components/game/GameEntry";

export const metadata: Metadata = {
  title: "wiTTy's Translation Rescue · Booth kiosk",
};

/** Booth kiosk mode: attract loop, idle reset, staff panel, large touch targets. */
export default function KioskPage() {
  return <GameEntry mode="kiosk" />;
}

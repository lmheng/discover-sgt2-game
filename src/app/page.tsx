import { GameEntry } from "@/components/game/GameEntry";

/** Mobile / personal-device mode (e.g. reached through the QR code, where hosting is approved). */
export default function Home() {
  return <GameEntry mode="mobile" />;
}

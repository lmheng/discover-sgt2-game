"use client";

import { useMemo, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/game/rng";

const COLOURS = ["#2f6bff", "#7b4dff", "#9db8ff", "#d9ccff", "#ff4d5e", "#ffffff"];

/** Lightweight CSS confetti (transform-only; hidden under reduced motion). */
export function Confetti({ count = 60, seed = 7 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      style: {
        left: `${r() * 100}%`,
        background: COLOURS[Math.floor(r() * COLOURS.length)],
        "--dx": `${(r() - 0.5) * 200}px`,
        "--rot": `${360 + r() * 720}deg`,
        "--dur": `${2.2 + r() * 1.8}s`,
        "--delay": `${r() * 0.6}s`,
        borderRadius: r() > 0.5 ? "50%" : "2px",
      } as CSSProperties,
    }));
  }, [count, seed]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span key={p.key} className="confetti-piece" style={p.style} />
      ))}
    </div>
  );
}

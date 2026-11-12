"use client";

import { useMemo, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/game/rng";

const COLOURS = ["#e63946", "#88d49e", "#ffe885", "#ff9f9f", "#1e5631", "#fffdf9"];

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
        // Square "pixels"; every third piece is a wide strip.
        ...(r() > 0.66 ? { width: "16px", height: "6px" } : {}),
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

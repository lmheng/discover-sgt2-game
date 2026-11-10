"use client";

import { wittyAssets, type WittyPose } from "@/config/brand";

/**
 * wiTTy, the SG Translate 2.0 mascot.
 *
 * Renders the approved PNG for each pose from /public/brand/witty. Until the
 * approved artwork is supplied, it renders a neutral labelled placeholder,
 * never substitute character art.
 *
 * Motion uses only translate, rotate and uniform scale (CSS keyframes in
 * globals.css), so the artwork's proportions, expression and colours are never
 * distorted. Reduced-motion users get a static image.
 */

const animationFor: Record<WittyPose, string> = {
  idle: "animate-float",
  celebrate: "animate-hop",
  oops: "animate-wobble",
  thinking: "animate-float",
  wave: "animate-float",
  cheer: "animate-cheer",
};

const altFor: Record<WittyPose, string> = {
  idle: "wiTTy, the SG Translate mascot",
  celebrate: "wiTTy celebrating",
  oops: "wiTTy reacting to a mistake",
  thinking: "wiTTy thinking",
  wave: "wiTTy waving",
  cheer: "wiTTy cheering",
};

export function Witty({
  pose = "idle",
  size = 120,
  reactionKey,
  className = "",
  decorative = false,
}: {
  pose?: WittyPose;
  size?: number;
  /** Change this value to replay the pose animation (e.g. a feedback sequence number). */
  reactionKey?: number | string;
  className?: string;
  decorative?: boolean;
}) {
  const src = wittyAssets[pose] ?? wittyAssets.idle;
  return (
    <div
      key={`${pose}-${reactionKey ?? ""}`}
      className={`${animationFor[pose]} inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      data-testid="witty"
      data-pose={pose}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- static local brand asset; no optimisation needed
        <img
          src={src}
          alt={decorative ? "" : altFor[pose]}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <div
          role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : `${altFor[pose]} (placeholder)`}
          aria-hidden={decorative || undefined}
          className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300/70 bg-navy-800/70 text-center"
        >
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-blue-300" style={{ fontSize: Math.max(10, size / 9) }}>
            wiTTy
          </span>
          <span className="mt-0.5 text-[0.6rem] text-muted" style={{ fontSize: Math.max(9, size / 12) }}>
            {pose} · placeholder
          </span>
        </div>
      )}
    </div>
  );
}

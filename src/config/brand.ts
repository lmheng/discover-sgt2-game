/**
 * Brand asset slots.
 *
 * Approved wiTTy PNGs go in /public/brand/witty/<pose>.png. Set a pose's value to
 * its public path once the approved file is added. While a value is `null`,
 * the game shows a neutral labelled placeholder. The game never draws a
 * substitute mascot.
 *
 * Animations apply only translation, rotation and uniform scale, so wiTTy's
 * proportions, expression and colours are never altered.
 */
export const wittyPoses = ["idle", "celebrate", "oops", "thinking", "wave", "cheer"] as const;
export type WittyPose = (typeof wittyPoses)[number];

export const wittyAssets: Record<WittyPose, string | null> = {
  idle: null, // "/brand/witty/idle.png"
  celebrate: null, // "/brand/witty/celebrate.png"
  oops: null, // "/brand/witty/oops.png"
  thinking: null, // "/brand/witty/thinking.png"
  wave: null, // "/brand/witty/wave.png"
  cheer: null, // "/brand/witty/cheer.png"
};

/** Product and event logos. `null` renders a text placeholder. */
export const brandAssets = {
  sgtLogoOnDark: null as string | null, // "/brand/sgt2-logo-on-dark.svg"
  sgtLogoOnLight: null as string | null, // "/brand/sgt2-logo-on-light.svg"
  eventLockup: null as string | null, // "/brand/discover-2026-lockup.svg"
  productIcons: {
    together: null as string | null, // "/brand/icon-together.svg"
    polyglot: null as string | null, // "/brand/icon-polyglot.svg"
    api: null as string | null, // "/brand/icon-api.svg"
  },
};

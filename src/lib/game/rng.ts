/**
 * Seeded pseudo-random utilities (mulberry32). Randomness is only consumed at
 * mission initialisation, so every reducer stays pure and replayable from a seed.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle with a seeded generator. Returns a new array. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** Shuffle while keeping `pinned` items at the end in their original order. */
export function shuffleWithPinned<T>(items: readonly T[], seed: number, isPinned: (item: T) => boolean): T[] {
  const free = items.filter((i) => !isPinned(i));
  const pinned = items.filter(isPinned);
  return [...seededShuffle(free, seed), ...pinned];
}

/** Non-deterministic 32-bit seed for live play (tests pass explicit seeds). */
export function randomSeed(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  }
  return Math.floor(Math.random() * 0xffffffff);
}

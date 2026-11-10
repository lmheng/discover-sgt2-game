"use client";

/**
 * Optional sound effects, synthesised with WebAudio (no audio files).
 * Muted by default; the game is fully playable without sound.
 */

export type SoundKind = "correct" | "wrong" | "tick" | "combo" | "complete" | "warning";

let ctx: AudioContext | null = null;
let muted = true;

export function setMuted(m: boolean) {
  muted = m;
  if (!m && !ctx && typeof window !== "undefined" && "AudioContext" in window) ctx = new AudioContext();
  if (!m) void ctx?.resume();
}

export function isMuted() {
  return muted;
}

const recipes: Record<SoundKind, { f: number[]; d: number; type: OscillatorType }> = {
  correct: { f: [660, 990], d: 0.09, type: "triangle" },
  combo: { f: [660, 880, 1320], d: 0.08, type: "triangle" },
  wrong: { f: [220, 165], d: 0.12, type: "sine" },
  warning: { f: [440, 330, 440], d: 0.1, type: "square" },
  tick: { f: [880], d: 0.04, type: "sine" },
  complete: { f: [523, 659, 784, 1047], d: 0.12, type: "triangle" },
};

export function playSound(kind: SoundKind) {
  if (muted || !ctx) return;
  const r = recipes[kind];
  const t0 = ctx.currentTime;
  r.f.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = r.type;
    osc.frequency.value = freq;
    const start = t0 + i * r.d;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + r.d);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + r.d + 0.02);
  });
}

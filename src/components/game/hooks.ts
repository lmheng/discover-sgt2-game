"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * requestAnimationFrame loop that reports frame deltas. Pauses while the tab
 * is hidden, and reducers clamp large deltas, so backgrounding never skips the game.
 */
export function useGameLoop(onTick: (dtMs: number) => void, running: boolean) {
  const cb = useRef(onTick);
  useEffect(() => {
    cb.current = onTick;
  });
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      if (!document.hidden) cb.current(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame((t) => {
      last = t;
      raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

/** Tweened integer for score counters (instant under reduced motion). */
export function useAnimatedNumber(value: number, durationMs = 450): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (reduce) {
      fromRef.current = value;
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value, durationMs, reduce]);
  return display;
}

/** Returns the latest item only for `ms` after it changes (for toasts and reactions). */
export function useTransient<T extends { seq: number }>(item: T | null, ms = 1700): T | null {
  const [visibleSeq, setVisibleSeq] = useState<number | null>(null);
  useEffect(() => {
    if (!item) return;
    const show = requestAnimationFrame(() => setVisibleSeq(item.seq));
    const hide = setTimeout(() => setVisibleSeq((s) => (s === item.seq ? null : s)), ms);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [item, ms]);
  return item && item.seq === visibleSeq ? item : null;
}

/** Calls `onDone` once, `delayMs` after `done` becomes true. */
export function useOnceWhen(done: boolean, onDone: () => void, delayMs = 700) {
  const fired = useRef(false);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  useEffect(() => {
    if (!done || fired.current) return;
    const id = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      cb.current();
    }, delayMs);
    return () => clearTimeout(id);
  }, [done, delayMs]);
}

/** Global keyboard shortcut handler (ignores keys typed into inputs). */
export function useKeys(handler: (e: KeyboardEvent) => void, enabled = true) {
  const cb = useRef(handler);
  useEffect(() => {
    cb.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      cb.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** Find the drop target (an element with data-drop) under a viewport point. */
export function dropTargetAt(clientX: number, clientY: number): string | null {
  if (typeof document === "undefined") return null;
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const target = (el as HTMLElement).closest<HTMLElement>("[data-drop]");
    if (target?.dataset.drop) return target.dataset.drop;
  }
  return null;
}

/** Wraps a pointer-ish event into viewport coordinates. */
export function clientPoint(e: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } | null {
  if ("changedTouches" in e && e.changedTouches.length > 0) {
    const t = e.changedTouches[0]!;
    return { x: t.clientX, y: t.clientY };
  }
  if ("clientX" in e) return { x: e.clientX, y: e.clientY };
  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { exportPending, flush, onPendingChange } from "@/lib/analytics/client";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { useGame } from "@/components/game/GameContext";
import { useKeys } from "@/components/game/hooks";

/**
 * Booth kiosk helpers:
 *  - Idle guard: a visible "Still playing?" countdown before resetting to the attract screen
 *  - Staff panel (Shift+S, or long-press the top-left corner): reset, GovEntry
 *    reminder, sound, fullscreen, offline data export, exit kiosk (PIN)
 */
export function KioskLayer({
  idleEnabled,
  idleAfterMs,
  onIdleReset,
  onStaffReset,
}: {
  idleEnabled: boolean;
  idleAfterMs: number;
  onIdleReset: () => void;
  onStaffReset: () => void;
}) {
  const { event } = useGame();
  const lastActivity = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  // Activity tracking.
  useEffect(() => {
    lastActivity.current = Date.now();
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", bump, opts);
    window.addEventListener("keydown", bump, opts);
    window.addEventListener("touchstart", bump, opts);
    return () => {
      window.removeEventListener("pointerdown", bump, opts);
      window.removeEventListener("keydown", bump, opts);
      window.removeEventListener("touchstart", bump, opts);
    };
  }, []);

  // Idle detection and countdown.
  useEffect(() => {
    if (!idleEnabled || staffOpen || reminderOpen) {
      lastActivity.current = Date.now();
      const id = requestAnimationFrame(() => setCountdown(null));
      return () => cancelAnimationFrame(id);
    }
    const total = event.kiosk.idleCountdownMs;
    const id = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle < idleAfterMs) {
        setCountdown(null);
        return;
      }
      const left = total - (idle - idleAfterMs);
      if (left <= 0) {
        setCountdown(null);
        lastActivity.current = Date.now();
        onIdleReset();
      } else {
        setCountdown(Math.ceil(left / 1000));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [idleEnabled, idleAfterMs, event.kiosk.idleCountdownMs, onIdleReset, staffOpen, reminderOpen]);

  useKeys((e) => {
    if (e.shiftKey && (e.key === "S" || e.key === "s")) {
      e.preventDefault();
      setStaffOpen((o) => !o);
    }
    if (e.key === "Escape") {
      setStaffOpen(false);
      setReminderOpen(false);
    }
  });

  // Long-press hotspot (top-left corner) for touch screens.
  const pressTimer = useRef<number | null>(null);
  const startPress = () => {
    pressTimer.current = window.setTimeout(() => setStaffOpen(true), 1500);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <>
      <div
        aria-hidden
        className="fixed left-0 top-0 z-[60] h-14 w-14"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onContextMenu={(e) => e.preventDefault()}
      />

      <AnimatePresence>
        {countdown !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 px-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-title"
            data-testid="idle-warning"
          >
            <RetroWindow title="IDLE.MSG" icon="clock" variant="butter" className="w-full max-w-md" bodyClassName="flex flex-col items-center gap-4 p-8 text-center">
              <h2 id="idle-title" className="font-pixel text-3xl font-bold uppercase">
                Still playing?
              </h2>
              <p className="text-lg text-muted">
                Returning to the start screen in <span className="font-pixel text-2xl text-ink">{countdown}</span> s
              </p>
              <Button size="xl" onClick={() => setCountdown(null)} autoFocus>
                I&apos;m still here
              </Button>
            </RetroWindow>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {staffOpen ? (
        <StaffPanel
          onClose={() => setStaffOpen(false)}
          onReset={() => {
            setStaffOpen(false);
            onStaffReset();
          }}
          onReminder={() => {
            setStaffOpen(false);
            setReminderOpen(true);
          }}
        />
      ) : null}

      {reminderOpen ? (
        <div className="desk-bg fixed inset-0 z-[80] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-labelledby="goventry-title" data-testid="goventry-reminder">
          <div className="retro-surface flex max-w-2xl flex-col items-center gap-6 p-8 text-center">
            <span className="flex h-24 w-24 items-center justify-center border-2 border-ink bg-butter shadow-pixel">
              <Icon name="stamp" size={52} />
            </span>
            <h2 id="goventry-title" className="font-pixel text-3xl font-bold uppercase sm:text-5xl">
              GovEntry booth stamp
            </h2>
            <p className="text-2xl text-muted">{event.govEntryReminder}</p>
            <p className="text-sm text-muted">Staff: please scan using the official GovEntry process.</p>
            <Button size="xl" onClick={() => setReminderOpen(false)} autoFocus>
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StaffPanel({ onClose, onReset, onReminder }: { onClose: () => void; onReset: () => void; onReminder: () => void }) {
  const { event, muted, toggleMute } = useGame();
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => onPendingChange(setPending), []);

  const download = async () => {
    const blob = new Blob([await exportPending()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witty-queue-${event.id}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const pressDigit = (d: string) => {
    const next = (pin + d).slice(0, 8);
    setPin(next);
    if (next === event.kiosk.staffPin) router.push("/?exitKiosk=1");
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-ink/50 px-4" role="dialog" aria-modal="true" aria-labelledby="staff-title" data-testid="staff-panel">
      <RetroWindow
        title="STAFF_PANEL.SYS"
        titleId="staff-title"
        icon="lock"
        variant="coral"
        onClose={onClose}
        closeLabel="Close staff panel"
        className="w-full max-w-lg"
        bodyClassName="p-6"
      >
        {pinMode ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted">Enter staff PIN to exit kiosk mode</p>
            <p className="font-mono text-3xl tracking-[0.5em]" aria-live="polite">
              {"•".repeat(pin.length) || "-"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((k) => (
                <button
                  key={k}
                  type="button"
                  className="retro-press h-14 w-16 border-2 border-ink bg-paper font-pixel text-xl text-ink shadow-pixel-sm"
                  onClick={() => (k === "C" ? setPin("") : k === "←" ? setPin(pin.slice(0, -1)) : pressDigit(k))}
                >
                  {k}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="md" onClick={() => setPinMode(false)}>
              Back
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <Button onClick={onReminder} icon="stamp" data-testid="staff-goventry">
              Show GovEntry stamp reminder
            </Button>
            <Button variant="secondary" onClick={onReset} icon="replay" data-testid="staff-reset">
              Reset for next visitor
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" size="md" onClick={toggleMute} icon={muted ? "mute" : "sound"}>
                {muted ? "Sound off" : "Sound on"}
              </Button>
              <Button variant="secondary" size="md" onClick={toggleFullscreen} icon="expand">
                Fullscreen
              </Button>
            </div>
            <div className="checker border-2 border-ink p-3 text-sm">
              <p className="mb-2">
                Records waiting to sync on this device: <strong data-testid="pending-count">{pending ?? "…"}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    const r = await flush();
                    setSyncMsg(r.pending === 0 ? "All records synced." : `${r.pending} still queued (server unreachable?).`);
                  }}
                >
                  Sync now
                </Button>
                <Button variant="secondary" size="md" onClick={download} icon="arrow">
                  Export queue (JSON)
                </Button>
              </div>
              {syncMsg ? <p className="mt-2 text-muted" role="status">{syncMsg}</p> : null}
            </div>
            <Button variant="ghost" size="md" onClick={() => setPinMode(true)} icon="exit">
              Exit kiosk mode
            </Button>
          </div>
        )}
      </RetroWindow>
    </div>
  );
}

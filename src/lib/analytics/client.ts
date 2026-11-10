"use client";

import { openDB, type IDBPDatabase } from "idb";
import { getCollectionMode } from "@/config";
import { anyRecordSchema, MAX_RECORDS_PER_BATCH, type AnyRecord } from "./schema";

/**
 * Offline-first analytics client.
 *
 * Every record is validated, then written to an IndexedDB outbox on this
 * device, then flushed to /api/events when it can be reached. If the server is
 * unavailable (or collection mode is "browser"), records stay queued and staff
 * can export them as JSON from the staff panel for later import.
 */

const DB_NAME = "witty-outbox";
const STORE = "records";
let dbPromise: Promise<IDBPDatabase> | null = null;
let memoryFallback: AnyRecord[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function db(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === "undefined") return null;
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: "recordId" });
    },
  });
  return dbPromise;
}

type Listener = (pending: number) => void;
const listeners = new Set<Listener>();
export function onPendingChange(fn: Listener): () => void {
  listeners.add(fn);
  void pendingCount().then(fn);
  return () => listeners.delete(fn);
}
async function notify() {
  const n = await pendingCount();
  for (const l of listeners) l(n);
}

export async function pendingCount(): Promise<number> {
  const d = db();
  if (!d) return memoryFallback.length;
  try {
    return await (await d).count(STORE);
  } catch {
    return memoryFallback.length;
  }
}

async function allPending(): Promise<AnyRecord[]> {
  const d = db();
  if (!d) return [...memoryFallback];
  try {
    return ((await (await d).getAll(STORE)) as AnyRecord[]).concat(memoryFallback);
  } catch {
    return [...memoryFallback];
  }
}

async function remove(ids: readonly string[]) {
  const set = new Set(ids);
  memoryFallback = memoryFallback.filter((r) => !set.has(r.recordId));
  const d = db();
  if (!d) return;
  try {
    const tx = (await d).transaction(STORE, "readwrite");
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  } catch {
    // Ignore: the record is retried later and the server de-duplicates by recordId.
  }
}

/** Queue a record. Invalid records are dropped (and logged in development). */
export async function track(record: AnyRecord): Promise<void> {
  if (getCollectionMode() === "off") return;
  const parsed = anyRecordSchema.safeParse(record);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") console.warn("[analytics] invalid record dropped", parsed.error.issues);
    return;
  }
  const d = db();
  try {
    if (!d) throw new Error("no idb");
    await (await d).put(STORE, parsed.data);
  } catch {
    memoryFallback.push(parsed.data);
  }
  void notify();
  scheduleFlush();
}

function scheduleFlush(delay = 800) {
  if (getCollectionMode() !== "server" || flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, delay);
}

/** Send queued records to the server. Safe to call repeatedly. */
export async function flush(): Promise<{ sent: number; pending: number }> {
  if (getCollectionMode() !== "server" || flushing) return { sent: 0, pending: await pendingCount() };
  flushing = true;
  let sent = 0;
  try {
    const pending = await allPending();
    for (let i = 0; i < pending.length; i += MAX_RECORDS_PER_BATCH) {
      const batch = pending.slice(i, i + MAX_RECORDS_PER_BATCH);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ records: batch }),
        keepalive: true,
      });
      if (!res.ok) {
        // A 400 means the whole batch is malformed and would never succeed.
        if (res.status === 400) await remove(batch.map((r) => r.recordId));
        break;
      }
      const body = (await res.json()) as { accepted?: string[] };
      const accepted = new Set(body.accepted ?? []);
      // Records the server rejected (e.g. stale timestamps) are not retried forever.
      await remove(batch.map((r) => r.recordId));
      sent += accepted.size;
    }
  } catch {
    // Offline: keep the queue and retry later.
  } finally {
    flushing = false;
    void notify();
  }
  return { sent, pending: await pendingCount() };
}

/** JSON export of the local queue for the offline fallback (admin import). */
export async function exportPending(): Promise<string> {
  return JSON.stringify({ exportedAt: new Date().toISOString(), records: await allPending() }, null, 2);
}

export function startBackgroundSync(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onOnline = () => void flush();
  window.addEventListener("online", onOnline);
  const id = window.setInterval(() => void flush(), 30_000);
  void flush();
  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(id);
  };
}

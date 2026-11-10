import { promises as fs } from "node:fs";
import path from "node:path";
import {
  gameplayRecordSchema,
  interestRecordSchema,
  researchRecordSchema,
  streamNames,
  type AnyRecord,
  type GameplayRecord,
  type InterestRecord,
  type ResearchRecord,
  type StreamName,
} from "@/lib/analytics/schema";

/**
 * Local-first JSONL store: one append-only file per stream, so gameplay,
 * research and interest data stay physically separate.
 *
 * Intended for a single Node process (the booth laptop). A hosted deployment
 * (option B) should replace this module with an approved database adapter that
 * keeps the same function signatures.
 */

export interface Lead {
  eventCode: string;
  count: number;
  updatedAt: string;
}

export interface StoreSnapshot {
  gameplay: GameplayRecord[];
  research: ResearchRecord[];
  interest: InterestRecord[];
  leads: Lead[];
}

export function dataDir(): string {
  const dir = process.env.DATA_DIR;
  // The data folder is configured at runtime; exclude it from build file tracing.
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), dir && dir.length > 0 ? dir : "data");
}

const fileFor = (stream: StreamName) => path.join(dataDir(), `${stream}.jsonl`);
const leadsFile = () => path.join(dataDir(), "leads.json");

// Serialise writes within the process.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function ensureDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

const parsers = {
  gameplay: gameplayRecordSchema,
  research: researchRecordSchema,
  interest: interestRecordSchema,
} as const;

async function readLines(stream: StreamName): Promise<AnyRecord[]> {
  let raw: string;
  try {
    raw = await fs.readFile(fileFor(stream), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = parsers[stream].safeParse(JSON.parse(line));
      if (parsed.success && !seen.has(parsed.data.recordId)) {
        seen.add(parsed.data.recordId);
        out.push(parsed.data);
      }
    } catch {
      // Skip a corrupt line rather than failing the whole read.
    }
  }
  return out;
}

export async function readStream<S extends StreamName>(
  stream: S,
): Promise<Extract<AnyRecord, { stream: S }>[]> {
  return (await readLines(stream)) as Extract<AnyRecord, { stream: S }>[];
}

/** Append validated records; records whose recordId already exists are skipped. */
export function appendRecords(records: readonly AnyRecord[]): Promise<number> {
  return exclusive(async () => {
    await ensureDir();
    let written = 0;
    for (const stream of streamNames) {
      const batch = records.filter((r) => r.stream === stream);
      if (batch.length === 0) continue;
      const existing = new Set((await readLines(stream)).map((r) => r.recordId));
      const fresh = batch.filter((r) => !existing.has(r.recordId));
      const unique = fresh.filter((r, i) => fresh.findIndex((x) => x.recordId === r.recordId) === i);
      if (unique.length === 0) continue;
      await fs.appendFile(fileFor(stream), unique.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
      written += unique.length;
    }
    return written;
  });
}

export async function readLeads(): Promise<Lead[]> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(leadsFile(), "utf8"));
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

export function setLeads(eventCode: string, count: number): Promise<Lead[]> {
  return exclusive(async () => {
    await ensureDir();
    const leads = (await readLeads()).filter((l) => l.eventCode !== eventCode);
    leads.push({ eventCode, count, updatedAt: new Date().toISOString() });
    await fs.writeFile(leadsFile(), JSON.stringify(leads, null, 2), "utf8");
    return leads;
  });
}

export async function snapshot(): Promise<StoreSnapshot> {
  const [gameplay, research, interest, leads] = await Promise.all([
    readStream("gameplay"),
    readStream("research"),
    readStream("interest"),
    readLeads(),
  ]);
  return { gameplay, research, interest, leads };
}

export function retentionDays(): number {
  const n = Number(process.env.RETENTION_DAYS ?? "90");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}

/** Remove records older than the retention window. Returns the number removed. */
export function purgeExpired(now: Date = new Date()): Promise<number> {
  return exclusive(async () => {
    const cutoff = now.getTime() - retentionDays() * 86_400_000;
    let removed = 0;
    for (const stream of streamNames) {
      const rows = await readLines(stream);
      const keep = rows.filter((r) => Date.parse(r.recordedAt) >= cutoff);
      if (keep.length !== rows.length) {
        removed += rows.length - keep.length;
        await fs.writeFile(
          fileFor(stream),
          keep.map((r) => JSON.stringify(r)).join("\n") + (keep.length ? "\n" : ""),
          "utf8",
        );
      }
    }
    return removed;
  });
}

/** Irreversibly delete all collected data (admin-confirmed). */
export function deleteAll(): Promise<void> {
  return exclusive(async () => {
    for (const stream of streamNames) await fs.rm(fileFor(stream), { force: true });
    await fs.rm(leadsFile(), { force: true });
  });
}

import { researchContent } from "@/config";
import type { GameplayRecord, InterestRecord, ResearchRecord } from "@/lib/analytics/schema";
import { mulberry32 } from "@/lib/game/rng";
import type { ResearchAnswers } from "@/lib/research/schema";

/**
 * SYNTHETIC DEMO DATA. Generated in memory for dashboard demos only.
 * It is never written to the store, and the dashboard watermarks it
 * everywhere. The distributions are uniform-random and carry no meaning.
 */

export const DEMO_EVENT_CODE = "demo-synthetic";

function seededUuid(rand: () => number): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rand() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16] as string, 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function generateDemoData(visits = 120, seed = 2026) {
  const rand = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
  const ids = (q: keyof typeof researchContent.questions) => researchContent.questions[q].options.map((o) => o.id);
  const gameplay: GameplayRecord[] = [];
  const research: ResearchRecord[] = [];
  const interest: InterestRecord[] = [];
  const start = Date.parse("2026-11-27T02:00:00Z");

  for (let i = 0; i < visits; i++) {
    const visitId = seededUuid(rand);
    const gameSessionId = seededUuid(rand);
    const t0 = start + Math.floor(rand() * 5.5 * 3_600_000);
    const at = (ms: number) => new Date(t0 + ms).toISOString();
    const base = {
      visitId,
      eventCode: DEMO_EVENT_CODE,
      source: rand() < 0.8 ? ("kiosk" as const) : ("mobile" as const),
      consentStatus: "implied_by_play" as const,
      schemaVersion: 1 as const,
    };
    gameplay.push({ ...base, stream: "gameplay", recordId: seededUuid(rand), recordedAt: at(0), gameSessionId, attempt: 1, type: "session_started" });
    if (rand() < 0.85) {
      const totalScore = Math.floor(rand() * 8000);
      gameplay.push({
        ...base,
        stream: "gameplay",
        recordId: seededUuid(rand),
        recordedAt: at(110_000),
        gameSessionId,
        attempt: 1,
        type: "session_completed",
        totalScore,
        tier: totalScore >= 5000 ? "master" : totalScore >= 2500 ? "specialist" : "rookie",
        durationMs: 90_000 + Math.floor(rand() * 40_000),
        missionsSucceeded: Math.floor(rand() * 4),
      });
    } else {
      gameplay.push({ ...base, stream: "gameplay", recordId: seededUuid(rand), recordedAt: at(60_000), gameSessionId, attempt: 1, type: "session_abandoned", reason: "idle_reset", stepKind: "play" });
      continue;
    }
    if (rand() < 0.75) {
      const multi = (q: "contentTypes" | "challenges" | "tools") => {
        if (rand() < 0.08) return { status: "skipped" as const };
        const opts = ids(q).filter((x) => x !== "none");
        const values = opts.filter(() => rand() < 0.3);
        return { status: "answered" as const, values: values.length ? values : q === "contentTypes" ? [] : ["none"] };
      };
      const frequency = pick(ids("frequency"));
      const answers: ResearchAnswers = {
        workFunction: { status: "answered", value: pick(ids("workFunction")) },
        frequency: { status: "answered", value: frequency },
        contentTypes: frequency === "never" ? { status: "not_applicable" } : multi("contentTypes"),
        challenges: multi("challenges"),
        tools: multi("tools"),
        capability: { status: "answered", value: pick(ids("capability")) },
      };
      research.push({ ...base, stream: "research", recordId: seededUuid(rand), recordedAt: at(115_000), answers });
    }
    const r = rand();
    if (r < 0.3) {
      interest.push({ ...base, stream: "interest", recordId: seededUuid(rand), recordedAt: at(120_000), type: "interest_expressed" });
      interest.push({ ...base, stream: "interest", recordId: seededUuid(rand), recordedAt: at(121_000), type: base.source === "kiosk" ? "formsg_qr_shown" : "formsg_link_opened" });
    } else if (r < 0.6) {
      interest.push({ ...base, stream: "interest", recordId: seededUuid(rand), recordedAt: at(120_000), type: "interest_declined" });
    }
  }
  return { gameplay, research, interest, leads: [] };
}

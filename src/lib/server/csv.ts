import type { GameplayRecord, InterestRecord, ResearchRecord } from "@/lib/analytics/schema";
import { latestResearchPerVisit } from "@/lib/admin/aggregate";

/** RFC 4180 CSV with spreadsheet formula-injection protection. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = Array.isArray(value) ? value.join(";") : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";
}

const base = ["recordId", "visitId", "eventCode", "source", "consentStatus", "schemaVersion", "recordedAt"] as const;

export function gameplayCsv(rows: readonly GameplayRecord[]): string {
  const headers = [
    ...base,
    "gameSessionId",
    "attempt",
    "type",
    "mission",
    "score",
    "success",
    "durationMs",
    "totalScore",
    "tier",
    "missionsSucceeded",
    "reason",
    "stepKind",
  ];
  return toCsv(
    headers,
    rows.map((r) => {
      const x = r as Record<string, unknown>;
      return headers.map((h) => x[h]);
    }),
  );
}

const researchQs = ["workFunction", "frequency", "contentTypes", "challenges", "tools", "capability"] as const;

/** One row per respondent (latest response per visit). */
export function researchCsv(rows: readonly ResearchRecord[]): string {
  const headers = [...base, ...researchQs.flatMap((q) => [`${q}_status`, q])];
  return toCsv(
    headers,
    latestResearchPerVisit(rows).map((r) => [
      ...base.map((h) => r[h]),
      ...researchQs.flatMap((q) => {
        const a = r.answers[q];
        if (!a) return ["not_reached", ""];
        if (a.status !== "answered") return [a.status, ""];
        return ["answered", "value" in a ? a.value : a.values];
      }),
    ]),
  );
}

export function interestCsv(rows: readonly InterestRecord[]): string {
  const headers = [...base, "type"];
  return toCsv(
    headers,
    rows.map((r) => [...base.map((h) => r[h]), r.type]),
  );
}

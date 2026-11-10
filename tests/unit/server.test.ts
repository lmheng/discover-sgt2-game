// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { csvCell, toCsv, researchCsv } from "@/lib/server/csv";
import { createLimiter } from "@/lib/server/rateLimit";
import { createSessionToken, hashPasscode, verifyPasscode, verifySessionToken } from "@/lib/server/auth";
import type { ResearchRecord } from "@/lib/analytics/schema";

describe("csv", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(["a", "b"])).toBe("a;b");
    expect(csvCell(null)).toBe("");
  });
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK()")).toBe("'=HYPERLINK()");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("builds CRLF rows", () => {
    expect(toCsv(["x", "y"], [[1, 2]])).toBe("x,y\r\n1,2\r\n");
  });
  it("research export is one row per respondent with statuses", () => {
    const b = {
      visitId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      eventCode: "discover-2026",
      source: "kiosk" as const,
      consentStatus: "implied_by_play" as const,
      schemaVersion: 1 as const,
      stream: "research" as const,
    };
    const rows: ResearchRecord[] = [
      { ...b, recordId: "00000000-0000-4000-8000-000000000001", recordedAt: "2026-11-27T03:00:00.000Z", answers: { tools: { status: "skipped" } } },
      {
        ...b,
        recordId: "00000000-0000-4000-8000-000000000002",
        recordedAt: "2026-11-27T03:05:00.000Z",
        answers: { tools: { status: "answered", values: ["vendors", "generic_ai"] } },
      },
    ];
    const csv = researchCsv(rows).trim().split("\r\n");
    expect(csv).toHaveLength(2);
    expect(csv[1]).toContain("answered,vendors;generic_ai");
    expect(csv[1]).toContain("not_reached");
  });
});

describe("rate limiter", () => {
  it("allows a burst then refills over time", () => {
    const l = createLimiter(3, 60);
    expect([l.take("a", 0), l.take("a", 0), l.take("a", 0), l.take("a", 0)]).toEqual([true, true, true, false]);
    expect(l.take("b", 0)).toBe(true);
    expect(l.take("a", 1_000)).toBe(true);
  });
  it("caps the number of tracked keys", () => {
    const l = createLimiter(1, 1, 10);
    for (let i = 0; i < 50; i++) l.take(`k${i}`, 0);
    expect(l.size()).toBeLessThanOrEqual(10);
  });
});

describe("auth", () => {
  const secret = "x".repeat(40);
  it("verifies scrypt passcodes", async () => {
    const h = await hashPasscode("correct horse battery", 1024);
    expect(await verifyPasscode("correct horse battery", h)).toBe(true);
    expect(await verifyPasscode("wrong", h)).toBe(false);
    expect(await verifyPasscode("anything", "garbage")).toBe(false);
    expect(await verifyPasscode("anything", undefined)).toBe(false);
  });
  it("signs and expires session tokens", () => {
    const t = createSessionToken(secret, 1_000);
    expect(verifySessionToken(t, secret, 2_000)).toBe(true);
    expect(verifySessionToken(t, "y".repeat(40), 2_000)).toBe(false);
    expect(verifySessionToken(t, secret, 1_000 + 9 * 3_600_000)).toBe(false);
    expect(verifySessionToken(t.replace(/.$/, "A"), secret, 2_000)).toBe(false);
    expect(verifySessionToken(t, "short", 2_000)).toBe(false);
  });
});

describe("store and ingest route", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "witty-"));
    process.env.DATA_DIR = dir;
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.DATA_DIR;
  });

  const rec = (id: string, extra: Record<string, unknown> = {}) => ({
    recordId: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
    visitId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    eventCode: "discover-2026",
    source: "mobile",
    consentStatus: "implied_by_play",
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    stream: "interest",
    type: "interest_expressed",
    ...extra,
  });
  const post = async (body: unknown, headers: Record<string, string> = {}) => {
    const { POST } = await import("@/app/api/events/route");
    return POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );
  };

  it("accepts valid records, de-duplicates, and rejects bad ones", async () => {
    const r1 = await post({ records: [rec("1"), rec("1"), rec("2", { eventCode: "unknown-event" }), { hello: "x" }] });
    expect(r1.status).toBe(200);
    const b1 = (await r1.json()) as { written: number; rejected: number };
    expect(b1.written).toBe(1);
    expect(b1.rejected).toBe(2);
    const r2 = await post({ records: [rec("1")] });
    expect(((await r2.json()) as { written: number }).written).toBe(0);
    const { readStream } = await import("@/lib/server/store");
    expect(await readStream("interest")).toHaveLength(1);
  });

  it("rejects cross-origin posts, bad JSON and oversized bodies", async () => {
    expect((await post({ records: [rec("3")] }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ records: [rec("4", { type: "x".repeat(70_000) })] })).status).toBe(413);
  });

  it("purges records past retention and deletes everything on request", async () => {
    const { appendRecords, purgeExpired, deleteAll, snapshot } = await import("@/lib/server/store");
    const { anyRecordSchema } = await import("@/lib/analytics/schema");
    await appendRecords([anyRecordSchema.parse(rec("9", { recordedAt: "2020-01-01T00:00:00.000Z" }))]);
    expect((await snapshot()).interest.length).toBe(2);
    expect(await purgeExpired()).toBe(1);
    await deleteAll();
    expect((await snapshot()).interest.length).toBe(0);
  });
});

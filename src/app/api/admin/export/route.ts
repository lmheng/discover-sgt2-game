import { z } from "zod";
import { generateDemoData } from "@/lib/admin/demoData";
import { sgDate } from "@/lib/admin/aggregate";
import { gameplayCsv, interestCsv, researchCsv } from "@/lib/server/csv";
import { json, parseFilters, requireAdmin } from "@/lib/server/http";
import { snapshot, type StoreSnapshot } from "@/lib/server/store";

const streamSchema = z.enum(["gameplay", "research", "interest"]);

/** Admin-only CSV export of one stream (filtered by event/date). */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const stream = streamSchema.safeParse(url.searchParams.get("stream"));
  url.searchParams.delete("stream");
  const parsed = parseFilters(url);
  if (!stream.success || !parsed.success) return json({ error: "invalid_query" }, 400);
  const { demo, eventCode, from, to } = parsed.data;

  const data: StoreSnapshot = demo === "1" ? generateDemoData() : await snapshot();
  const keep = (r: { eventCode: string; recordedAt: string }) =>
    (demo === "1" || !eventCode || r.eventCode === eventCode) &&
    (!from || sgDate(r.recordedAt) >= from) &&
    (!to || sgDate(r.recordedAt) <= to);

  const csv =
    stream.data === "gameplay"
      ? gameplayCsv(data.gameplay.filter(keep))
      : stream.data === "research"
        ? researchCsv(data.research.filter(keep))
        : interestCsv(data.interest.filter(keep));

  const prefix = demo === "1" ? "SYNTHETIC-DEMO-" : "";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${prefix}witty-${stream.data}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}

import { events } from "@/config";
import { aggregate } from "@/lib/admin/aggregate";
import { DEMO_EVENT_CODE, generateDemoData } from "@/lib/admin/demoData";
import { json, parseFilters, requireAdmin } from "@/lib/server/http";
import { purgeExpired, retentionDays, snapshot } from "@/lib/server/store";

/** Aggregated metrics only; no participant-level records are returned. */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const parsed = parseFilters(new URL(req.url));
  if (!parsed.success) return json({ error: "invalid_filters" }, 400);
  const { demo, ...filters } = parsed.data;

  if (demo === "1") {
    const data = generateDemoData();
    return json({
      demo: true,
      events: [{ id: DEMO_EVENT_CODE, name: "Synthetic demo event" }],
      retentionDays: retentionDays(),
      summary: aggregate(data, { ...filters, eventCode: filters.eventCode ? DEMO_EVENT_CODE : undefined }),
    });
  }

  await purgeExpired();
  const data = await snapshot();
  return json({
    demo: false,
    events: events.map((e) => ({ id: e.id, name: e.name })),
    retentionDays: retentionDays(),
    summary: aggregate(data, filters),
  });
}

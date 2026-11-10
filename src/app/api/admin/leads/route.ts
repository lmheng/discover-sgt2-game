import { z } from "zod";
import { knownEventIds } from "@/config";
import { json, readJsonBody, requireAdmin } from "@/lib/server/http";
import { setLeads } from "@/lib/server/store";

const bodySchema = z.strictObject({
  eventCode: z.string().refine((v) => knownEventIds.has(v), "Unknown event"),
  count: z.number().int().min(0).max(100_000),
});

/** Manually record onboarding leads counted from FormSG (aggregate number only). */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await readJsonBody(req, 1_024);
  if (!body.ok) return body.res;
  const parsed = bodySchema.safeParse(body.data);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);
  const leads = await setLeads(parsed.data.eventCode, parsed.data.count);
  return json({ ok: true, leads });
}

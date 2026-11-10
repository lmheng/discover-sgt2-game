import { z } from "zod";
import { json, readJsonBody, requireAdmin } from "@/lib/server/http";
import { deleteAll } from "@/lib/server/store";

const DELETE_CONFIRMATION = "DELETE ALL DATA";
const bodySchema = z.strictObject({ confirm: z.literal(DELETE_CONFIRMATION) });

/** Irreversible deletion of all collected records (retention / end-of-event cleanup). */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await readJsonBody(req, 256);
  if (!body.ok) return body.res;
  if (!bodySchema.safeParse(body.data).success) return json({ error: "confirmation_required" }, 400);
  await deleteAll();
  return json({ ok: true });
}

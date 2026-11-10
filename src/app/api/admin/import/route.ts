import { z } from "zod";
import { knownEventIds } from "@/config";
import { anyRecordSchema, type AnyRecord } from "@/lib/analytics/schema";
import { json, readJsonBody, requireAdmin } from "@/lib/server/http";
import { appendRecords } from "@/lib/server/store";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const fileSchema = z.object({ records: z.array(z.unknown()).max(20_000) });

/**
 * Imports a browser-queue export (offline fallback). Every record is
 * re-validated; duplicates (same recordId) are ignored.
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await readJsonBody(req, MAX_IMPORT_BYTES);
  if (!body.ok) return body.res;
  const file = fileSchema.safeParse(body.data);
  if (!file.success) return json({ error: "invalid_file" }, 400);

  const valid: AnyRecord[] = [];
  let rejected = 0;
  for (const raw of file.data.records) {
    const r = anyRecordSchema.safeParse(raw);
    if (r.success && knownEventIds.has(r.data.eventCode)) valid.push(r.data);
    else rejected++;
  }
  const written = await appendRecords(valid);
  return json({ received: file.data.records.length, written, duplicates: valid.length - written, rejected });
}

import { knownEventIds } from "@/config";
import { MAX_BODY_BYTES, anyRecordSchema, ingestPayloadSchema, type AnyRecord } from "@/lib/analytics/schema";
import { json, readJsonBody, sameOrigin } from "@/lib/server/http";
import { clientKey, ingestLimiter } from "@/lib/server/rateLimit";
import { appendRecords, retentionDays } from "@/lib/server/store";

/**
 * Anonymous record ingestion for the game client.
 * - Strict schema validation (unknown fields rejected; no free text accepted)
 * - Body size limit, per-client rate limit, same-origin check
 * - No IP address, user agent or other identifier is persisted
 */
export async function POST(req: Request) {
  if (process.env.COLLECTION_DISABLED === "true") return json({ error: "collection_disabled" }, 503);
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  if (!ingestLimiter.take(clientKey(req.headers))) return json({ error: "rate_limited" }, 429, { "retry-after": "30" });

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  if (!body.ok) return body.res;
  const payload = ingestPayloadSchema.safeParse(body.data);
  if (!payload.success) return json({ error: "invalid_payload" }, 400);

  const now = Date.now();
  const oldest = now - retentionDays() * 86_400_000;
  const valid: AnyRecord[] = [];
  const rejected: string[] = [];
  for (const raw of payload.data.records) {
    const r = anyRecordSchema.safeParse(raw);
    if (!r.success) {
      rejected.push("schema");
      continue;
    }
    const t = Date.parse(r.data.recordedAt);
    if (!knownEventIds.has(r.data.eventCode)) rejected.push("unknown_event");
    else if (t > now + 5 * 60_000 || t < oldest) rejected.push("timestamp");
    else valid.push(r.data);
  }

  const written = valid.length > 0 ? await appendRecords(valid) : 0;
  // Accepted ids let the client clear its outbox, including duplicates already stored.
  return json({ accepted: valid.map((r) => r.recordId), written, rejected: rejected.length });
}

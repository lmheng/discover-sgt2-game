import { z } from "zod";
import { isAuthorisedRequest } from "./auth";

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

/** Rejects cross-site browser posts: an Origin header, when present, must match the host. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function readJsonBody(req: Request, maxBytes: number): Promise<{ ok: true; data: unknown } | { ok: false; res: Response }> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, res: json({ error: "payload_too_large" }, 413) };
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) return { ok: false, res: json({ error: "payload_too_large" }, 413) };
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, res: json({ error: "invalid_json" }, 400) };
  }
}

/** Defence in depth: every admin route re-checks the session (the proxy checks too). */
export function requireAdmin(req: Request): Response | null {
  if (!isAuthorisedRequest(req)) return json({ error: "unauthorised" }, 401);
  if (req.method !== "GET" && !sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  return null;
}

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optId = z.string().regex(/^[a-z0-9_-]{1,40}$/);

export const filtersSchema = z.strictObject({
  eventCode: optId.optional(),
  from: day.optional(),
  to: day.optional(),
  workFunction: optId.optional(),
  frequency: optId.optional(),
  capability: optId.optional(),
  demo: z.enum(["1"]).optional(),
});

export function parseFilters(url: URL) {
  const raw: Record<string, string> = {};
  for (const [k, v] of url.searchParams) if (v !== "") raw[k] = v;
  return filtersSchema.safeParse(raw);
}

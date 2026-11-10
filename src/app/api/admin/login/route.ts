import { z } from "zod";
import { SESSION_COOKIE, SESSION_TTL_MS, adminConfigured, createSessionToken, verifyPasscode } from "@/lib/server/auth";
import { json, readJsonBody, sameOrigin } from "@/lib/server/http";
import { clientKey, loginLimiter } from "@/lib/server/rateLimit";

const bodySchema = z.strictObject({ passcode: z.string().min(1).max(256) });

export async function POST(req: Request) {
  if (!adminConfigured()) return json({ error: "admin_not_configured" }, 503);
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  if (!loginLimiter.take(clientKey(req.headers))) return json({ error: "rate_limited" }, 429, { "retry-after": "60" });

  const body = await readJsonBody(req, 2_048);
  if (!body.ok) return body.res;
  const parsed = bodySchema.safeParse(body.data);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);

  const ok = await verifyPasscode(parsed.data.passcode, process.env.ADMIN_PASSCODE_HASH);
  if (!ok) return json({ error: "invalid_passcode" }, 401);

  const token = createSessionToken(process.env.ADMIN_SESSION_SECRET as string);
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return json({ ok: true }, 200, {
    "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`,
  });
}

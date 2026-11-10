import { SESSION_COOKIE } from "@/lib/server/auth";
import { json, sameOrigin } from "@/lib/server/http";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  return json({ ok: true }, 200, {
    "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  });
}

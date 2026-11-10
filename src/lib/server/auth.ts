import { createHmac, scrypt as scryptCb, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Administrator authentication.
 *
 * - ADMIN_PASSCODE_HASH: "scrypt$N$r$p$<salt b64>$<hash b64>" (generate with `npm run admin:hash`)
 * - ADMIN_SESSION_SECRET: at least 32 random characters, used to sign session cookies.
 *
 * If either is missing, the admin area is disabled.
 */

export const SESSION_COOKIE = "wtr_admin";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function scrypt(password: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, keylen, { ...opts, maxmem: 256 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE_HASH) && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;
}

export async function hashPasscode(passcode: string, N = 16384, r = 8, p = 1): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(passcode, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPasscode(passcode: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length === 0 || passcode.length > 256) return false;
  try {
    const key = await scrypt(passcode, Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const payload = b64url(JSON.stringify({ v: 1, exp: now + SESSION_TTL_MS }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret || secret.length < 32) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { v?: number; exp?: number };
    return data.v === 1 && typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/** Cookie header helper shared by API routes. */
export function sessionFromCookieHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return v.join("=");
  }
  return undefined;
}

export function isAuthorisedRequest(req: Request): boolean {
  return (
    adminConfigured() &&
    verifySessionToken(sessionFromCookieHeader(req.headers.get("cookie")), process.env.ADMIN_SESSION_SECRET)
  );
}

/**
 * In-memory token-bucket rate limiter (per process). Client keys are held in
 * memory only for limiting and are never written to disk or logs.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface Limiter {
  take(key: string, now?: number): boolean;
  size(): number;
}

export function createLimiter(capacity: number, refillPerMinute: number, maxKeys = 5_000): Limiter {
  const buckets = new Map<string, Bucket>();
  const ratePerMs = refillPerMinute / 60_000;
  return {
    take(key, now = Date.now()) {
      const b = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
      const tokens = Math.min(capacity, b.tokens + (now - b.updatedAt) * ratePerMs);
      if (tokens < 1) {
        buckets.set(key, { tokens, updatedAt: now });
        return false;
      }
      buckets.delete(key); // re-insert to keep Map order as recency
      buckets.set(key, { tokens: tokens - 1, updatedAt: now });
      if (buckets.size > maxKeys) {
        const oldest = buckets.keys().next().value;
        if (oldest !== undefined) buckets.delete(oldest);
      }
      return true;
    },
    size: () => buckets.size,
  };
}

/** Best-effort client key from proxy headers; falls back to a shared key. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "local";
}

export const ingestLimiter = createLimiter(30, 60);
export const loginLimiter = createLimiter(5, 5);

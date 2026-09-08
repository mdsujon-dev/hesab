import "server-only";

type Bucket = { count: number; resetAt: number };

// In-memory fixed window. Good enough for a single instance; swap for Redis
// (or Vercel KV) when the app runs on more than one node.
const globalForLimit = globalThis as unknown as {
  _rateLimitBuckets?: Map<string, Bucket>;
};
const buckets = globalForLimit._rateLimitBuckets ?? new Map<string, Bucket>();
globalForLimit._rateLimitBuckets = buckets;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

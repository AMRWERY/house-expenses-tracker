/**
 * Tiny fixed-window rate limiter, kept in memory.
 * Good enough to stop a person (or a script) hammering the auth routes. On serverless hosts each
 * instance has its own counters, so it is a speed bump, not a hard guarantee; Supabase still enforces
 * its own limits behind it.
 */
const hits = new Map<string, { count: number; resetAt: number }>()

/** Throws 429 (with Retry-After) once `key` has been used more than `limit` times within `windowMs`. */
export function rateLimit(event: Parameters<typeof setResponseHeader>[0], key: string, limit: number, windowMs: number) {
  const now = Date.now()

  // Drop expired entries so the map can't grow forever.
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)

  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (++entry.count > limit) {
    setResponseHeader(event, 'Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    throw createError({ statusCode: 429, message: 'rate_limited' })
  }
}

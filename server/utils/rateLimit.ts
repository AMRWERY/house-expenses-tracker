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
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({ statusCode: 429, message: 'rate_limited', data: { retryAfter } })
  }
}

/**
 * The 429 for a rate limit reported by Supabase, carrying how long to wait (seconds).
 * Supabase says "...you can only request this after 49 seconds" for per-user limits; its email-sending
 * limit (built-in sender, a few per hour) has no number, so we assume an hour.
 */
export function supabaseRateLimitError(error: { code?: string; message?: string }) {
  const seconds = Number(/(\d+)\s*seconds?/i.exec(error.message ?? '')?.[1])
  const retryAfter = seconds > 0 ? seconds : error.code === 'over_email_send_rate_limit' ? 3600 : 60
  return createError({ statusCode: 429, message: 'rate_limited', data: { retryAfter } })
}

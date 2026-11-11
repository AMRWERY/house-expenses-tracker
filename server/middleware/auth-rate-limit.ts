// Throttle the public auth routes per client address, before any work (or Supabase email) happens.
const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/auth/register': { limit: 3, windowMs: 10 * 60_000 }, // each one can send an email
  '/api/auth/login': { limit: 10, windowMs: 60_000 },
  '/api/auth/password': { limit: 10, windowMs: 60_000 },
}

export default defineEventHandler((event) => {
  if (event.method !== 'POST') return
  const rule = LIMITS[event.path.split('?')[0] ?? '']
  if (!rule) return
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  rateLimit(event, `${event.path.split('?')[0]}:${ip}`, rule.limit, rule.windowMs)
})

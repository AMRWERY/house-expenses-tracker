// name@domain.tld, e.g. test@house.com. No spaces, one "@", a dot in the domain, 2+ letter ending.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const bad = (statusCode: number, message: string) => createError({ statusCode, message })

/** Emails are case-insensitive: store and compare them lowercase. */
export function parseEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (email.length > 254 || !EMAIL_RE.test(email)) throw bad(400, 'invalid_email')
  return email
}

/**
 * Validate an email + password request body.
 * `isNew` enforces the password rules (sign-up); sign-in only needs something to check.
 * 72 is the bcrypt limit Supabase uses; longer passwords would be silently truncated.
 */
export function parseCredentials(body: unknown, isNew: boolean) {
  const b = (body ?? {}) as Record<string, unknown>
  const email = parseEmail(b.email)
  const password = typeof b.password === 'string' ? b.password : ''

  if (isNew) {
    if (password.length < 8 || password.length > 72) throw bad(400, 'weak_password')
  } else if (!password || password.length > 72) {
    throw bad(401, 'invalid_credentials') // same answer as a wrong password: don't hint
  }
  return { email, password }
}

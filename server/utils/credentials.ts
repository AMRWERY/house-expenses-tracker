// name@domain.tld, e.g. test@house.com. No spaces, one "@", a dot in the domain, 2+ letter ending.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const bad = (statusCode: number, message: string) => createError({ statusCode, message })

/** Emails are case-insensitive: store and compare them lowercase. */
export function parseEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (email.length > 254 || !EMAIL_RE.test(email)) throw bad(400, 'invalid_email')
  return email
}

/** The name a person types at sign-up: 1-40 characters, extra spaces collapsed. */
export function parseName(value: unknown) {
  const name = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  if (name.length < 1 || name.length > 40) throw bad(400, 'invalid_name')
  return name
}

/** The name to greet someone with: their sign-up name (kept in Supabase user_metadata), else the part of the email before "@". */
export function displayNameOf(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }, fallbackEmail: string) {
  const raw = user.user_metadata?.name
  const name = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 40) : ''
  return name || (user.email ?? fallbackEmail).split('@')[0] || ''
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

/** Validate a change-password request body: the current password and a new one that follows the sign-up rules. */
export function parsePasswordChange(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const currentPassword = typeof b.currentPassword === 'string' ? b.currentPassword : ''
  const newPassword = typeof b.newPassword === 'string' ? b.newPassword : ''

  if (!currentPassword || currentPassword.length > 72) throw bad(400, 'wrong_current_password')
  if (newPassword.length < 8 || newPassword.length > 72) throw bad(400, 'weak_password')
  if (newPassword === currentPassword) throw bad(400, 'same_password')
  return { currentPassword, newPassword }
}

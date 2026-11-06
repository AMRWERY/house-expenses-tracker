// Email + password sign-in (desktop). Supabase Auth checks the password; we then start our own session.
export default defineEventHandler(async (event) => {
  const { email, password } = parseCredentials(await readBody(event), false)

  const { data, error } = await newAuthClient().auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') throw createError({ statusCode: 403, message: 'email_not_confirmed' })
    if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
      throw createError({ statusCode: 429, message: 'rate_limited' })
    }
    // Wrong email and wrong password look the same, so this can't be used to discover accounts.
    throw createError({ statusCode: 401, message: 'invalid_credentials' })
  }

  await setUserSession(event, { user: { id: data.user.id, email: data.user.email ?? email } })
  return { ok: true }
})

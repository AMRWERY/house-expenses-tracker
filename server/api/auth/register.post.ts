// Email + password sign-up (desktop). Supabase creates the account and, when the project requires it,
// sends the confirmation email. Until the address is confirmed there is no session.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = parseCredentials(body, true)
  const name = parseName((body ?? {}).name)

  // The name is kept on the Supabase account (user_metadata), so every sign-in can read it back.
  const { data, error } = await newAuthClient().auth.signUp({ email, password, options: { data: { name } } })

  if (error) {
    if (error.status === 429 || error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit') {
      throw createError({ statusCode: 429, message: 'rate_limited' })
    }
    if (error.code === 'user_already_exists') throw createError({ statusCode: 409, message: 'email_exists' })
    if (error.code === 'weak_password') throw createError({ statusCode: 400, message: 'weak_password' })
    console.error('[auth] signUp failed', error.code, error.message)
    throw createError({ statusCode: 400, message: 'signup_failed' })
  }

  // Confirmation switched off in the Supabase project: the account is usable straight away.
  if (data.session && data.user) {
    await setUserSession(event, { user: { id: data.user.id, email: data.user.email ?? email, name } })
    return { needsConfirmation: false }
  }

  return { needsConfirmation: true }
})

// Email + password sign-up (desktop). Supabase creates the account and, when the project requires it,
// sends the confirmation email. Until the address is confirmed there is no session.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = parseCredentials(body, true)
  const name = parseName((body ?? {}).name)
  // Optional profile picture; checked before the account exists so a bad file doesn't half-create one.
  const rawAvatar = (body ?? {}).avatar
  const avatar = rawAvatar ? parseAvatar(rawAvatar) : null

  // The name is kept on the Supabase account (user_metadata), so every sign-in can read it back.
  // Where the confirmation link lands. Without this Supabase uses the project's dashboard "Site URL",
  // which was still http://localhost:3000, so production users were sent to localhost. SITE_URL pins it;
  // otherwise it is the address this request came in on. Supabase only honours it if it is also listed
  // under Authentication > URL Configuration > Redirect URLs.
  const siteUrl = (process.env.SITE_URL || getRequestURL(event).origin).replace(/\/+$/, '')

  const { data, error } = await newAuthClient().auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${siteUrl}/` },
  })

  if (error) {
    if (error.status === 429 || error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit') {
      // Supabase's own limit (the built-in email sender allows only a few emails per hour).
      console.error('[auth] signUp rate limited by Supabase', error.code, error.message)
      throw createError({ statusCode: 429, message: 'rate_limited' })
    }
    if (error.code === 'user_already_exists') throw createError({ statusCode: 409, message: 'email_exists' })
    if (error.code === 'weak_password') throw createError({ statusCode: 400, message: 'weak_password' })
    console.error('[auth] signUp failed', error.code, error.message)
    throw createError({ statusCode: 400, message: 'signup_failed' })
  }

  // The picture is saved under the new account's id, whether or not the email still needs confirming.
  // A storage hiccup must not undo a sign-up that worked: they can upload again from Settings.
  if (avatar && data.user) {
    try {
      await saveAvatar(data.user.id, avatar)
    } catch (e) {
      console.error('[auth] avatar at sign-up failed', e)
    }
  }

  // Confirmation switched off in the Supabase project: the account is usable straight away.
  if (data.session && data.user) {
    await setUserSession(event, { user: { id: data.user.id, email: data.user.email ?? email, name } })
    return { needsConfirmation: false }
  }

  return { needsConfirmation: true }
})

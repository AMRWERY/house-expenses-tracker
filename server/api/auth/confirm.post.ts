// Finishes email confirmation. Supabase's confirmation link sends the person back to the site with a
// short-lived access token in the URL (after the #). The browser hands that token here; we ask Supabase
// who it belongs to and, if that address is confirmed, start our own session so they land signed in.
export default defineEventHandler(async (event) => {
  const { accessToken } = (await readBody(event)) ?? {}
  if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 4096) {
    throw createError({ statusCode: 400, message: 'confirm_failed' })
  }

  const { data, error } = await newAuthClient().auth.getUser(accessToken)
  const user = data?.user
  if (error || !user?.email || !user.email_confirmed_at) {
    throw createError({ statusCode: 401, message: 'confirm_failed' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: displayNameOf(user, user.email) },
  })
  return { ok: true }
})

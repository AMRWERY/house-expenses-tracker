// Change the signed-in person's display name. It lives on the Supabase account (user_metadata.name) so every
// future sign-in reads it back, and in the session cookie so the greeting updates right away.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const name = parseName(((await readBody(event)) ?? {}).name)

  const supabase = useSupabase()
  const { data: current, error: readError } = await supabase.auth.admin.getUserById(user.id)
  if (readError || !current.user) {
    console.error('[auth] name read failed', readError?.code, readError?.message)
    throw createError({ statusCode: 500, message: 'auth_failed' })
  }

  // Merge, so the other user_metadata keys survive.
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...current.user.user_metadata, name },
  })
  if (error) {
    console.error('[auth] name update failed', error.code, error.message)
    throw createError({ statusCode: 500, message: 'auth_failed' })
  }

  await setUserSession(event, { user: { ...user, name } })
  return { ok: true, name }
})

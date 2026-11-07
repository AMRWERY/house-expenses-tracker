// Change the signed-in person's password. The current password must be right (so a stolen session
// cookie alone can't take over the account); the new one is then set through Supabase Auth.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { currentPassword, newPassword } = parsePasswordChange(await readBody(event))

  const { error: checkError } = await newAuthClient().auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (checkError) {
    if (checkError.status === 429 || checkError.code === 'over_request_rate_limit') {
      throw createError({ statusCode: 429, message: 'rate_limited' })
    }
    throw createError({ statusCode: 400, message: 'wrong_current_password' })
  }

  const { error } = await useSupabase().auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) {
    if (error.code === 'same_password') throw createError({ statusCode: 400, message: 'same_password' })
    if (error.code === 'weak_password') throw createError({ statusCode: 400, message: 'weak_password' })
    console.error('[auth] password update failed', error.code, error.message)
    throw createError({ statusCode: 500, message: 'auth_failed' })
  }
  return { ok: true }
})

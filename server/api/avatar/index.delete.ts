// Remove the signed-in person's profile picture, so the default one is used again.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  await removeAvatar(user.id)
  return { ok: true }
})

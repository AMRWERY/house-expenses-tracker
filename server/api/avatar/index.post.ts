// Replace the signed-in person's profile picture. Body: { image: "data:image/jpeg;base64,..." }.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const avatar = parseAvatar(((await readBody(event)) ?? {}).image)
  await saveAvatar(user.id, avatar)
  return { ok: true }
})

// Whether the signed-in person has uploaded a profile picture (the page shows a remove button only then).
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return { has: await hasAvatar(user.id) }
})

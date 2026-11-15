// Accept an invitation addressed to the signed-in person's verified email.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return acceptInvitation(user.id, getRouterParam(event, 'id') ?? '')
})

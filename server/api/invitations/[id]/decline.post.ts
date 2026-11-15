// Decline an invitation addressed to the signed-in person's verified email.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  await declineInvitation(user.id, getRouterParam(event, 'id') ?? '')
  return { ok: true }
})

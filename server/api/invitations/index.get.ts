// Invitations addressed to the signed-in person's verified email.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return listMyInvitations(user.id)
})

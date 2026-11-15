// Invite someone by email (admin or owner). Body: { email, role }. They accept after signing in with that address.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'admin')
  return createInvitation(scope, parseInvitationInput(await readBody(event)))
})

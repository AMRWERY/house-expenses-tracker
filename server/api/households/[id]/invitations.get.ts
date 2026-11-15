// Open invitations of a household (admin or owner).
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'admin')
  return listInvitations(scope)
})

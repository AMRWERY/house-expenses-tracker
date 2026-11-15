// The members of a household the signed-in person belongs to.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'viewer')
  return listMembers(scope)
})

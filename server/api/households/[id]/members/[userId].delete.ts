// Remove a member (admin or owner), or leave the household (userId = yourself). The owner cannot leave.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'viewer')
  await removeMember(scope, getRouterParam(event, 'userId') ?? '')
  return { ok: true }
})

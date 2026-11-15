// Cancel an open invitation (admin or owner).
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'admin')
  await revokeInvitation(scope, getRouterParam(event, 'invId') ?? '')
  return { ok: true }
})

// Delete a shared household and everything in it (owner only).
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'owner')
  await deleteHousehold(scope)
  return { ok: true }
})

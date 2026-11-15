// Rename a shared household (admin or owner). Body: { name }.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'admin')
  await renameHousehold(scope, parseHouseholdName(await readBody(event)))
  return { ok: true }
})

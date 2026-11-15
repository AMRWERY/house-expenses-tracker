// Change a member's role (admin or owner; only the owner can make or change an admin). Body: { role }.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'admin')
  await setMemberRole(scope, getRouterParam(event, 'userId') ?? '', parseRoleInput(await readBody(event)))
  return { ok: true }
})

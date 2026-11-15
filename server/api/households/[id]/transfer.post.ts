// Hand the household to another member (owner only); the old owner becomes an admin. Body: { userId }.
export default defineEventHandler(async (event) => {
  const scope = await requireHouseholdScope(event, getRouterParam(event, 'id'), 'owner')
  const target = ((await readBody(event)) ?? {}).userId
  if (typeof target !== 'string') throw createError({ statusCode: 400, message: 'invalid_id' })
  await transferOwnership(scope, target)
  return { ok: true }
})

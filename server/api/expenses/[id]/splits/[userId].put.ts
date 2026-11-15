// Mark one participant's share settled (or not): body { settled }. Every change is logged.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseId(getRouterParam(event, 'id'))
  const b = ((await readBody(event)) ?? {}) as Record<string, unknown>
  if (typeof b.settled !== 'boolean') throw createError({ statusCode: 400, message: 'invalid_setting' })
  const record = await setShareSettled(scope, id, getRouterParam(event, 'userId') ?? '', b.settled)
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})

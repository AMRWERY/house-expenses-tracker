// Pause or resume a rule: body { active, today }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  const b = ((await readBody(event)) ?? {}) as Record<string, unknown>
  if (typeof b.active !== 'boolean') throw createError({ statusCode: 400, message: 'invalid_active' })
  const record = await setRecurringActive(scope, id, b.active, parseToday(b.today))
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})

export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  const record = await updateRecurring(scope, id, parseRecurringInput(await readBody(event)))
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})

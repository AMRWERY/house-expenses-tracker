// Confirm one occurrence and add the expense: body { date, amount? }. Safe to retry: it can only succeed once per occurrence.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  const result = await handleOccurrence(scope, id, parseOccurrenceAction(await readBody(event)), 'confirmed')
  if (!result) throw createError({ statusCode: 404, message: 'not_found' })
  return result
})

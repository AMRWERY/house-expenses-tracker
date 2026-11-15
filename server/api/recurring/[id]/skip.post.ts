// Skip one occurrence without adding an expense: body { date }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  const result = await handleOccurrence(scope, id, parseOccurrenceAction(await readBody(event)), 'skipped')
  if (!result) throw createError({ statusCode: 404, message: 'not_found' })
  return result
})

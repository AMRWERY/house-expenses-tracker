// The reminder for one occurrence was shown: body { date }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  const { date } = parseOccurrenceAction(await readBody(event))
  return (await markReminded(scope, id, date)) ?? { ok: false }
})

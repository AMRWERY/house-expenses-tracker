export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseId(getRouterParam(event, 'id'))
  const record = await updateIncome(scope, id, parseIncomeInput(await readBody(event)))
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})

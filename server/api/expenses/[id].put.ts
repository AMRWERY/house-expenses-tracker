export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseId(getRouterParam(event, 'id'))
  const input = parseExpenseInput(await readBody(event))

  const record = await updateExpense(scope, id, input)
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})
